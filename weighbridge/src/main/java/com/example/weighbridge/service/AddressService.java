
package com.example.weighbridge.service;

import com.example.weighbridge.model.AddressMaster;
import com.example.weighbridge.repository.AddressRepository;
import com.example.weighbridge.model.IndiaPostalDirectory;
import com.example.weighbridge.repository.IndiaPostalDirectoryRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class AddressService {

    private final AddressRepository repository;
    private final ObjectMapper objectMapper;
    private final IndiaPostalDirectoryRepository postalRepository;

    
        public AddressService(
                AddressRepository repository,
                ObjectMapper objectMapper,
                IndiaPostalDirectoryRepository postalRepository) {

        this.repository = repository;
        this.objectMapper = objectMapper;
        this.postalRepository = postalRepository;
        }


    // Response records
    public record PinLocation(
            String city,
            String state
    ) {}

    public record AddressRequest(
            String city,
            String state,
            String pincode
    ) {}

    
        public record CitySearchResult(
                String city,
                String state,
                String pincode,
                String officeName
        ) {}


    // 1. Fetch City and State from PIN code
    public List<PinLocation> lookupPincode(String pincode) {

        validatePincode(pincode);

        try {
            String apiUrl =
                    "https://api.postalpincode.in/pincode/"
                            + pincode;

            HttpURLConnection connection =
                    (HttpURLConnection) URI.create(apiUrl)
                            .toURL()
                            .openConnection();

            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);

            connection.setRequestProperty(
                    "Accept",
                    "application/json"
            );

            connection.setRequestProperty(
                    "User-Agent",
                    "curl/8.21.0"
            );

            String response;

            try {
                int statusCode =
                        connection.getResponseCode();

                if (statusCode != 200) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            "Postal API returned HTTP "
                                    + statusCode
                    );
                }

                try (InputStream inputStream =
                             connection.getInputStream()) {

                    response = new String(
                            inputStream.readAllBytes(),
                            StandardCharsets.UTF_8
                    );
                }

            } finally {
                connection.disconnect();
            }

            // Parse API response
            JsonNode root =
                    objectMapper.readTree(response);

            if (!root.isArray() || root.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Invalid postal API response"
                );
            }

            JsonNode result = root.get(0);

            String apiStatus =
                    result.path("Status").asText();

            if (!"Success".equalsIgnoreCase(apiStatus)) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No location found for this PIN code"
                );
            }

            JsonNode postOffices =
                    result.path("PostOffice");

            List<PinLocation> locations =
                    new ArrayList<>();

            if (postOffices.isArray()) {

                for (JsonNode office : postOffices) {

                    String city = office
                            .path("District")
                            .asText()
                            .trim();

                    String state = office
                            .path("State")
                            .asText()
                            .trim();

                    if (city.isBlank() || state.isBlank()) {
                        continue;
                    }

                    PinLocation location =
                            new PinLocation(city, state);

                    // Avoid duplicate City-State pairs
                    if (!locations.contains(location)) {
                        locations.add(location);
                    }
                }
            }

            if (locations.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No city or state found for this PIN code"
                );
            }

            return locations;

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (Exception ex) {

            System.err.println(
                    "PIN lookup failed: "
                            + ex.getMessage()
            );

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to fetch PIN code details",
                    ex
            );
        }
    }

    
@Transactional(readOnly = true)
public List<CitySearchResult> searchCity(String city) {

    if (city == null || city.trim().length() < 2) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Enter at least 2 characters for city search"
        );
    }

    if (city.trim().length() > 100) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "City search cannot exceed 100 characters"
        );
    }

    List<IndiaPostalDirectory> results =
            postalRepository.searchByCity(city.trim());

    return results.stream()
            .map(postal -> new CitySearchResult(
                    postal.getDistrict(),
                    postal.getState(),
                    postal.getPincode(),
                    postal.getOfficeName()
            ))
            .distinct()
            .toList();
}


    // 2. Get all addresses
    @Transactional(readOnly = true)
    public List<AddressMaster> getAllAddresses() {
        return repository.findAll();
    }

    // 3. Get address by ID
    @Transactional(readOnly = true)
    public AddressMaster getAddressById(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Address not found"
                        )
                );
    }

    // 4. Create address
    @Transactional
    public AddressMaster createAddress(
            AddressRequest request) {

        validateRequest(request);

        String city = request.city().trim();
        String state = request.state().trim();
        String pincode = request.pincode().trim();

        boolean exists = repository
                .existsByCityIgnoreCaseAndStateIgnoreCaseAndPincode(
                        city,
                        state,
                        pincode
                );

        if (exists) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Address already exists"
            );
        }

        AddressMaster address = new AddressMaster();

        address.setCity(city);
        address.setState(state);
        address.setPincode(pincode);

        try {
            return repository.saveAndFlush(address);

        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Address already exists or violates a database constraint",
                    ex
            );
        }
    }

    // 5. Update address
    @Transactional
    public AddressMaster updateAddress(
            Long id,
            AddressRequest request) {

        validateRequest(request);

        AddressMaster address = getAddressById(id);

        String city = request.city().trim();
        String state = request.state().trim();
        String pincode = request.pincode().trim();

        boolean sameAddress =
                address.getCity().equalsIgnoreCase(city)
                && address.getState().equalsIgnoreCase(state)
                && address.getPincode().equals(pincode);

        if (!sameAddress) {

            boolean duplicate = repository
                    .existsByCityIgnoreCaseAndStateIgnoreCaseAndPincode(
                            city,
                            state,
                            pincode
                    );

            if (duplicate) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Address already exists"
                );
            }
        }

        address.setCity(city);
        address.setState(state);
        address.setPincode(pincode);

        try {
            return repository.saveAndFlush(address);

        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Address already exists or violates a database constraint",
                    ex
            );
        }
    }

    // 6. Delete address
    @Transactional
    public void deleteAddress(Long id) {

        AddressMaster address = getAddressById(id);

        try {
            repository.delete(address);
            repository.flush();

        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete an address referenced by other records",
                    ex
            );
        }
    }

    // 7. Validate Indian PIN code
    private void validatePincode(String pincode) {

        if (pincode == null ||
                !pincode.matches("^[1-9][0-9]{5}$")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter a valid 6-digit Indian PIN code"
            );
        }
    }

    // 8. Validate address fields
    private void validateRequest(AddressRequest request) {

        if (request == null ||
                request.city() == null ||
                request.city().isBlank() ||
                request.state() == null ||
                request.state().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "City and State are required"
            );
        }

        if (request.city().trim().length() > 100 ||
                request.state().trim().length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "City and State must be at most 100 characters"
            );
        }

        validatePincode(request.pincode());
    }
}

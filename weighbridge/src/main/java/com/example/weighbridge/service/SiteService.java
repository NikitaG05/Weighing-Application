
package com.example.weighbridge.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.model.AddressMaster;
import com.example.weighbridge.model.SiteMaster;
import com.example.weighbridge.repository.LoginRepository;
import com.example.weighbridge.repository.SiteRepository;

@Service
public class SiteService {

    private final SiteRepository siteRepository;
    private final LoginRepository loginRepository;
    private final AddressService addressService;
    private final UserRegistrationService registrationService;

    public SiteService(
            SiteRepository siteRepository,
            LoginRepository loginRepository,
            AddressService addressService,
            UserRegistrationService registrationService) {

        this.siteRepository = siteRepository;
        this.loginRepository = loginRepository;
        this.addressService = addressService;
        this.registrationService = registrationService;
    }

    public record NewUserRequest(
        String username,
        String password,
        String fullName,
        String mobileNumber,
        String email
    ) {}

    public record SiteRequest(
        String siteName,
        Long addressId,
        AddressService.AddressRequest newAddress,
        Long userId,
        NewUserRequest newUser
    ) {}

    public record SiteResponse(
        Long id,
        String siteName,
        Long addressId,
        String city,
        String state,
        String pincode,
        Long userId,
        String username
    ) {}

    @Transactional(readOnly = true)
    public List<SiteResponse> getAllSites() {
        return siteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SiteResponse getSiteById(Long id) {
        return toResponse(findSite(id));
    }

    @Transactional
    public SiteResponse createSite(SiteRequest request) {

        validateRequest(request);

        Long addressId = resolveAddress(request);
        Long userId = resolveUser(request);

        SiteMaster site = new SiteMaster();
        site.setSiteName(request.siteName().trim());
        site.setAddressId(addressId);
        site.setUserId(userId);

        return toResponse(siteRepository.saveAndFlush(site));
    }

    @Transactional
    public SiteResponse updateSite(Long id, SiteRequest request) {

        validateRequest(request);

        SiteMaster site = findSite(id);

        Long addressId = resolveAddress(request);
        Long userId = resolveUser(request);

        site.setSiteName(request.siteName().trim());
        site.setAddressId(addressId);
        site.setUserId(userId);

        return toResponse(siteRepository.saveAndFlush(site));
    }

    @Transactional
    public void deleteSite(Long id) {
        SiteMaster site = findSite(id);
        siteRepository.delete(site);
        siteRepository.flush();
    }

    private SiteMaster findSite(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Site not found"
                ));
    }

    private Long resolveAddress(SiteRequest request) {

        if (request.addressId() != null) {
            return addressService
                    .getAddressById(request.addressId())
                    .getId();
        }

        AddressMaster address =
                addressService.createAddress(request.newAddress());

        return address.getId();
    }

    private Long resolveUser(SiteRequest request) {

        if (request.userId() != null) {
            return findUser(request.userId()).getAdminId();
        }

        NewUserRequest newUser = request.newUser();

        UserRegistrationService.RegistrationResponse user =
                registrationService.register(
                        newUser.username(),
                        newUser.password(),
                        newUser.fullName(),
                        newUser.mobileNumber(),
                        newUser.email(),
                        "USER"
                );

        return user.id();
    }

    private AdminLogin findUser(Long id) {
        return loginRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private SiteResponse toResponse(SiteMaster site) {

        AddressMaster address =
                addressService.getAddressById(site.getAddressId());

        AdminLogin user = findUser(site.getUserId());

        return new SiteResponse(
                site.getId(),
                site.getSiteName(),
                address.getId(),
                address.getCity(),
                address.getState(),
                address.getPincode(),
                user.getAdminId(),
                user.getUsername()
        );
    }

    private void validateRequest(SiteRequest request) {

        if (request == null ||
                request.siteName() == null ||
                request.siteName().isBlank() ||
                request.siteName().trim().length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Site name must contain 1 to 150 characters"
            );
        }

        boolean existingAddress = request.addressId() != null;
        boolean newAddress = request.newAddress() != null;

        if (existingAddress == newAddress) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Select an existing address or add a new address"
            );
        }

        boolean existingUser = request.userId() != null;
        boolean newUser = request.newUser() != null;

        if (existingUser == newUser) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Select an existing user or add a new user"
            );
        }
    }

    
public record SiteUserOption(
    Long id,
    String username
) {}

@Transactional(readOnly = true)
public List<SiteUserOption> getAvailableUsers() {

    return loginRepository.findAll()
        .stream()
        .filter(AdminLogin::isEnabled)
        .filter(user -> "USER".equals(user.getRole()))
        .map(user -> new SiteUserOption(
            user.getAdminId(),
            user.getUsername()
        ))
        .toList();
}

}

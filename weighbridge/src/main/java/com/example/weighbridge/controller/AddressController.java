
package com.example.weighbridge.controller;

import com.example.weighbridge.model.AddressMaster;
import com.example.weighbridge.service.AddressService;
import com.example.weighbridge.service.AddressService.AddressRequest;
import com.example.weighbridge.service.AddressService.PinLocation;
import com.example.weighbridge.service.AddressService.CitySearchResult;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    // 1. Auto-fetch City and State using PIN code
    @GetMapping("/pincode/{pincode}")
    public List<PinLocation> lookupPincode(
            @PathVariable String pincode) {

        return addressService.lookupPincode(pincode);
    }

    // 2. Search Indian postal locations by City
    @GetMapping("/search-city")
    public List<CitySearchResult> searchCity(
            @RequestParam String city) {

        return addressService.searchCity(city);
    }

    // 3. Get all addresses
    @GetMapping
    public List<AddressMaster> getAllAddresses() {

        return addressService.getAllAddresses();
    }

    // 4. Get address by ID
    @GetMapping("/{id}")
    public AddressMaster getAddressById(
            @PathVariable Long id) {

        return addressService.getAddressById(id);
    }

    // 5. Create address
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressMaster createAddress(
            @RequestBody AddressRequest request) {

        return addressService.createAddress(request);
    }

    // 6. Update address
    @PutMapping("/{id}")
    public AddressMaster updateAddress(
            @PathVariable Long id,
            @RequestBody AddressRequest request) {

        return addressService.updateAddress(id, request);
    }

    // 7. Delete address
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(
            @PathVariable Long id) {

        addressService.deleteAddress(id);
    }
}


package com.example.weighbridge.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.example.weighbridge.model.StatusMaster;
import com.example.weighbridge.service.StatusService;
import com.example.weighbridge.service.StatusService.StatusRequest;

@RestController
@RequestMapping("/api/admin/statuses")
public class StatusController {

    private final StatusService statusService;

    public StatusController(StatusService statusService) {
        this.statusService = statusService;
    }

    @GetMapping
    public List<StatusMaster> getAllStatuses() {
        return statusService.getAllStatuses();
    }

    @GetMapping("/{id}")
    public StatusMaster getStatusById(@PathVariable Long id) {
        return statusService.getStatusById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StatusMaster createStatus(
            @RequestBody StatusRequest request) {
        return statusService.createStatus(request);
    }

    @PutMapping("/{id}")
    public StatusMaster updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {
        return statusService.updateStatus(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStatus(@PathVariable Long id) {
        statusService.deleteStatus(id);
    }
}


package com.example.weighbridge.config;

import com.example.weighbridge.repository.LoginRepository;
import com.example.weighbridge.service.UserRegistrationService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class InitialAdminSetup implements ApplicationRunner {

    private final LoginRepository loginRepository;
    private final UserRegistrationService registrationService;

    @Value("${tarex.bootstrap.enabled:false}")
    private boolean enabled;

    @Value("${tarex.bootstrap.username:}")
    private String username;

    @Value("${tarex.bootstrap.password:}")
    private String password;

    @Value("${tarex.bootstrap.full-name:}")
    private String fullName;

    @Value("${tarex.bootstrap.mobile:}")
    private String mobile;

    @Value("${tarex.bootstrap.email:}")
    private String email;

    public InitialAdminSetup(
            LoginRepository loginRepository,
            UserRegistrationService registrationService) {
        this.loginRepository = loginRepository;
        this.registrationService = registrationService;
    }

    @Override
    public void run(ApplicationArguments args) {

        if (!enabled) {
            return;
        }

        if (loginRepository.count() != 0) {
            System.out.println(
                "Admin bootstrap skipped: accounts already exist."
            );
            return;
        }

        registrationService.register(
            username,
            password,
            fullName,
            mobile,
            email,
            "ADMIN"
        );

        System.out.println(
            "Initial administrator account created successfully."
        );
    }
}

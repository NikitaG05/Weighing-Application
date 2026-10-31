
package com.example.weighbridge.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "users")
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Full name is required")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotBlank(message = "Contact number is required")
    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "Contact number must contain 10 digits"
    )
    @Column(name = "contact", nullable = false, length = 10)
    private String contact;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Role is required")
    @Column(name = "role", nullable = false, length = 20)
    private String role;

    public Users() {
    }

    public Users(Long id, String fullName, String contact,
                 String email, String role) {
        this.id = id;
        this.fullName = fullName;
        this.contact = contact;
        this.email = email;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}

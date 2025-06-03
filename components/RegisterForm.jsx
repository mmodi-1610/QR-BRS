import { useState } from "react";
import {useRouter} from "next/navigation";
// import { apiRequest } from "../lib/auth";
import axios from "axios";
function RegisterForm({ onRegistered }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    adminPassword: "",
    kitchenPassword: "",
    confirmAdminPassword: "",
    confirmKitchenPassword: ""
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation errors on input change
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
    
    // Clear general error message
    if (showError) {
      setShowError(false);
    }
  };

const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Please enter a username";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Please enter an email address";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.adminPassword.trim()) {
      newErrors.adminPassword = "Please enter an admin password";
    } else if (formData.adminPassword.length < 6) {
      newErrors.adminPassword = "Admin password must be at least 6 characters";
    }
    if (!formData.kitchenPassword.trim()) {
      newErrors.kitchenPassword = "Please enter a kitchen password";
    } else if (formData.kitchenPassword.length < 6) {
      newErrors.kitchenPassword = "Kitchen password must be at least 6 characters";
    }
    if (formData.adminPassword !== formData.confirmAdminPassword) {
      newErrors.confirmAdminPassword = "Admin passwords do not match";
    }
    if (formData.kitchenPassword !== formData.confirmKitchenPassword) {
      newErrors.confirmKitchenPassword = "Kitchen passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(false);
    
    
    
    try {
      // Call register API
  await axios.post("/api/user/register", {
    username: formData.username,
    email: formData.email,
    adminPassword: formData.adminPassword,
    kitchenPassword: formData.kitchenPassword
  });
      
      // Registration successful
      alert("Registration successful! You can now log in.");
      onRegistered();
      
    } catch (error) {
      setErrorMessage(error.message || "Registration failed. Please try again.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Alert */}
      {showError && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </div>
      )}
      
      {/* Username Field */}
      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.username ? "is-invalid" : ""}`}
          id="reg-username"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
        <label htmlFor="reg-username">Username</label>
        {errors.username && (
          <div className="invalid-feedback">{errors.username}</div>
        )}
      </div>
      
      {/* Email Field */}
      <div className="form-floating mb-3">
        <input
          type="email"
          className={`form-control ${errors.email ? "is-invalid" : ""}`}
          id="reg-email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
        <label htmlFor="reg-email">Email Address</label>
        {errors.email && (
          <div className="invalid-feedback">{errors.email}</div>
        )}
      </div>
      
      {/* Admin Password Field */}
      <div className="form-floating mb-3">
        <input
          type="password"
          className={`form-control ${errors.adminPassword ? "is-invalid" : ""}`}
          id="adminPassword"
          name="adminPassword"
          placeholder="Admin Password"
          value={formData.adminPassword}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
        <label htmlFor="adminPassword">Admin Password</label>
        {errors.adminPassword && (
          <div className="invalid-feedback">{errors.adminPassword}</div>
        )}
      </div>
      {/* Confirm Admin Password Field */}
      <div className="form-floating mb-3">
        <input
          type="password"
          className={`form-control ${errors.confirmAdminPassword ? "is-invalid" : ""}`}
          id="confirmAdminPassword"
          name="confirmAdminPassword"
          placeholder="Confirm Admin Password"
          value={formData.confirmAdminPassword}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
        <label htmlFor="confirmAdminPassword">Confirm Admin Password</label>
        {errors.confirmAdminPassword && (
          <div className="invalid-feedback">{errors.confirmAdminPassword}</div>
        )}
      </div>
      {/* Kitchen Password Field */}
      <div className="form-floating mb-3">
        <input
          type="password"
          className={`form-control ${errors.kitchenPassword ? "is-invalid" : ""}`}
          id="kitchenPassword"
          name="kitchenPassword"
          placeholder="Kitchen Password"
          value={formData.kitchenPassword}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
        <label htmlFor="kitchenPassword">Kitchen Password</label>
        {errors.kitchenPassword && (
          <div className="invalid-feedback">{errors.kitchenPassword}</div>
        )}
      </div>
      {/* Confirm Kitchen Password Field */}
      <div className="form-floating mb-4">
        <input
          type="password"
          className={`form-control ${errors.confirmKitchenPassword ? "is-invalid" : ""}`}
          id="confirmKitchenPassword"
          name="confirmKitchenPassword"
          placeholder="Confirm Kitchen Password"
          value={formData.confirmKitchenPassword}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
        <label htmlFor="confirmKitchenPassword">Confirm Kitchen Password</label>
        {errors.confirmKitchenPassword && (
          <div className="invalid-feedback">{errors.confirmKitchenPassword}</div>
        )}
      </div>
      
      {/* Submit Button */}
      <div className="d-grid gap-2">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Registering...
            </>
          ) : (
            "Register"
          )}
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;
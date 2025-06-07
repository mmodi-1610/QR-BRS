"use client";
import { useState } from "react";
import { Eye, EyeOff } from "react-feather";

const PasswordInput = ({
  label,
  name,
  placeholder,
  value,
  error,
  required = false,
  onChange,
  showPassword,
  toggleShowPassword,
  disabled = false,
}) => (
  <div className="mb-3 relative">
    <label htmlFor={name} className="block mb-1 text-xs font-medium">
      {label}
    </label>
    <input
      id={name}
      type={showPassword[name] ? "text" : "password"}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      autoComplete="off"
      disabled={disabled}
      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none ${
        error ? "border-red-500" : "border-gray-300"
      } pr-8`}
    />
    <button
      type="button"
      onClick={() => toggleShowPassword(name)}
      className="absolute right-2 top-1/7 transform translate-y-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      aria-label={showPassword[name] ? "Hide password" : "Show password"}
      tabIndex={0}
      style={{ lineHeight: 0 }}
    >
      {showPassword[name] ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

function RegisterForm({ onRegistered }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    adminPassword: "",
    kitchenPassword: "",
    confirmAdminPassword: "",
    confirmKitchenPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const [showPassword, setShowPassword] = useState({
    adminPassword: false,
    confirmAdminPassword: false,
    kitchenPassword: false,
    confirmKitchenPassword: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (showError) {
      setShowError(false);
    }
  };

  const handleTogglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
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

    setIsLoading(true);

    try {
      await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          adminPassword: formData.adminPassword,
          kitchenPassword: formData.kitchenPassword,
        }),
      });

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
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-1">

      {showError && (
        <div
          className="mb-4 p-2 bg-red-100 text-red-700 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </div>
      )}

      {/* Username */}
      <div className="mb-3">
        <label htmlFor="username" className="block mb-1 text-xs font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Enter username"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={isLoading}
          className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none ${
            errors.username ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.username && (
          <p className="text-red-500 text-xs mt-1">{errors.username}</p>
        )}
      </div>

      {/* Email */}
      <div className="mb-3">
        <label htmlFor="email" className="block mb-1 text-xs font-medium">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Enter email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
          className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {/* Admin Password */}
      <PasswordInput
        label="Admin Password"
        name="adminPassword"
        placeholder="Enter admin password"
        value={formData.adminPassword}
        error={errors.adminPassword}
        required
        onChange={handleChange}
        showPassword={showPassword}
        toggleShowPassword={handleTogglePassword}
        disabled={isLoading}
      />

      {/* Confirm Admin Password */}
      <PasswordInput
        label="Confirm Admin Password"
        name="confirmAdminPassword"
        placeholder="Confirm admin password"
        value={formData.confirmAdminPassword}
        error={errors.confirmAdminPassword}
        required
        onChange={handleChange}
        showPassword={showPassword}
        toggleShowPassword={handleTogglePassword}
        disabled={isLoading}
      />

      {/* Kitchen Password */}
      <PasswordInput
        label="Kitchen Password"
        name="kitchenPassword"
        placeholder="Enter kitchen password"
        value={formData.kitchenPassword}
        error={errors.kitchenPassword}
        required
        onChange={handleChange}
        showPassword={showPassword}
        toggleShowPassword={handleTogglePassword}
        disabled={isLoading}
      />

      {/* Confirm Kitchen Password */}
      <PasswordInput
        label="Confirm Kitchen Password"
        name="confirmKitchenPassword"
        placeholder="Confirm kitchen password"
        value={formData.confirmKitchenPassword}
        error={errors.confirmKitchenPassword}
        required
        onChange={handleChange}
        showPassword={showPassword}
        toggleShowPassword={handleTogglePassword}
        disabled={isLoading}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition disabled:opacity-50"
      >
        {isLoading ? "Registering..." : "Register"}
      </button>
    </form>
  );
}

export default RegisterForm;

'use client'
import { useState } from "react";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";
import { Calendar } from "lucide-react";
import {useRouter} from "next/navigation";
import { useEffect, useRef} from "react";

function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-primary text-white text-center py-4">
                <div className="mb-3">
                  {/* <i className="bi bi-building-lock" style={{ fontSize: "3rem" }}></i> */}
                  <Calendar size={50}/>
                </div>
                <h3>Restaurant Management System</h3>
                <p className="mb-0">Please sign in to continue</p>
              </div>
              
              <div className="card-body p-4">
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === "login" ? "active" : ""}`}
                      onClick={() => setActiveTab("login")}
                    >
                      Sign In
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === "register" ? "active" : ""}`}
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </button>
                  </li>
                </ul>
                
                {activeTab === "login" ? (
                  <LoginForm />
                ) : (
                  <RegisterForm onRegistered={() => setActiveTab("login")} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
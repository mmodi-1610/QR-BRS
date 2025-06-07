'use client';
import { useState } from "react";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-blue-300">
      <div className="relative w-[900px] h-[550px] rounded-[30px] shadow-2xl overflow-hidden">
        {/* Container holding both form and panel */}
        <div className="absolute inset-0 w-full h-full flex">
          {/* Form Container */}
          <motion.div
            className="w-1/2 h-full bg-white z-20 flex justify-center items-center px-10"
            initial={false}
            animate={{ x: isLogin ? 0 : 450 }}
            transition={{ type: "spring", stiffness: 60 }}
          >
            <div className="w-full">
              <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">
                {isLogin ? "Sign In" : "Register"}
              </h2>
              {isLogin ? (
                <LoginForm />
              ) : (
                <RegisterForm onRegistered={() => setIsLogin(true)} />
              )}
            </div>
          </motion.div>

          {/* Panel (Decorative) */}
          <motion.div
            className="absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center items-center p-10 text-white z-10
              bg-gradient-to-br from-[#6a11cb] to-[#2575fc] rounded-r-[80px]"
            initial={false}
            animate={{ x: isLogin ? 450 : 0 }}
            transition={{ type: "spring", stiffness: 60 }}
          >
            {isLogin ? (
              <>
                <h2 className="text-3xl font-bold mb-4">Hello, Friend!</h2>
                <p className="mb-8 text-center text-lg font-medium px-4">
                  Register with your personal details to use all of site features
                </p>
                <button
                  onClick={() => setIsLogin(false)}
                  className="px-8 py-2 border-2 border-white rounded-full font-semibold hover:bg-white/10 transition"
                >
                  SIGN UP
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                <p className="mb-8 text-center text-lg font-medium px-4">
                  To keep connected with us please login with your personal info
                </p>
                <button
                  onClick={() => setIsLogin(true)}
                  className="px-8 py-2 border-2 border-white rounded-full font-semibold hover:bg-white/10 transition"
                >
                  SIGN IN
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

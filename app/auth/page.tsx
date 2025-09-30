"use client";

import LoginForm from "@/components/auth/loginForms";
import RegisterForm from "@/components/auth/registerForms";
import React, { useState } from "react";
import { Button, Card, Image, Input } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa6";

export default function Page() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      <div className=" h-full w-full flex">
        <div className="lg:w-1/2 w-full flex flex-col items-center justify-between p-6 bg-[url('/bgLight.png')] dark:bg-[url('/bgDark.png')] lg:bg-none lg:dark:bg-none">
          <div className="flex items-center justify-center">
            <img src="/logo.svg" alt="Kabat logo" className="w-6 h-6" />
            <h1 className="text-2xl font-semibold">ABAT</h1>
          </div>
          <div className="flex flex-col gap-4 bg-white/25 dark:bg-zinc-900/25 rounded-2xl p-4 shadow-xs backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-semibold">Welcome Back</h1>
              <p className="text-center text-sm text-gray-500">
                Welcome Back, Please enter Your details
              </p>
            </div>
            <div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 flex justify-between rounded-xl px-1 py-3 relative inset-shadow-sm">
                <div
                  className={`absolute top-1 bottom-1 left-1 w-1/2 rounded-xl bg-white dark:bg-zinc-600 transition-all duration-300 ease-in-out 
                     ${isLogin ? "" : "translate-x-[calc(100%-0.6rem)]"}`}
                ></div>
                <button
                  className={`w-1/2 z-10 transition-colors duration-300 ease-in-out
                     ${isLogin ? "" : "text-gray-400 "}`}
                  onClick={() => setIsLogin(true)}
                >
                  Sign In
                </button>
                <button
                  className={`w-1/2 z-10 transition-colors duration-300 ease-in-out
                     ${isLogin ? "text-gray-400" : ""}`}
                  onClick={() => setIsLogin(false)}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="w-96 overflow-hidden">
              <div
                className={`w-[200%] flex transition-transform duration-500 ease-in-out ${
                  isLogin ? "translate-x-0" : "-translate-x-1/2"
                }`}
              >
                <div
                  className={`w-1/2 transition-opacity duration-300 ease-in-out ${isLogin ? "" : "opacity-0"}`}
                >
                  <LoginForm />
                </div>
                <div
                  className={`w-1/2 transition-opacity duration-300 ease-in-out ${isLogin ? "opacity-0" : ""}`}
                >
                  <RegisterForm />
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-center text-xs text-gray-500 ">
              Join the millions of smart investors who trust us to manage their
              finances. Log in to access your personalized dashboard, track your
              portfolio performance, and make informed investment decisions.
            </p>
          </div>
        </div>

        <div className="hidden lg:block w-1/2 bg-[url('/bgLight.png')] dark:bg-[url('/bgDark.png')]"></div>
      </div>
    </>
  );
}

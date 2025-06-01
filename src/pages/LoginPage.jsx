import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const initialValues = { email: "", password: "" };

  const validate = (values) => {
    const errors = {};
    if (!values.email) {
      errors.email = "Required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = "Invalid email address";
    }
    if (!values.password) {
      errors.password = "Required";
    }
    return errors;
  };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const resp = await axios.get(
        "https://683c222328a0b0f2fdc64548.mockapi.io/auth",
        { params: { email: values.email } }
      );
      const users = resp.data;
      if (users.length === 0) {
        toast.error("No account found with that email.");
      } else {
        const user = users[0];
        if (user.password === values.password) {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("fullName", user.fullName);
          localStorage.setItem("email", user.email);
          localStorage.setItem("userId", user.id);

          toast.success("Login successful! Redirecting…");
          setTimeout(() => navigate("/chat"), 2000);
        } else {
          toast.error("Incorrect password");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Login failed. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-600 via-pink-500 to-red-400 p-6">
      <ToastContainer position="top-center" />

      <div className="bg-white shadow-2xl rounded-3xl max-w-md w-full p-8">
        <img
          src="logo.png"
          alt="Logo"
          className="h-30 w-full object-contain mb-6"
        />
        <h2 className="text-3xl font-bold text-purple-600 mb-6 text-center">
          Log In
        </h2>

        <Formik
          initialValues={initialValues}
          validate={validate}
          onSubmit={onSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-purple-700 font-medium mb-1"
                >
                  Email Address
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-purple-700 font-medium mb-1"
                >
                  Password
                </label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Logging In..." : "Log In"}
              </button>

              <Link to="/">
                <button className="w-full py-2 bg-pink-200 text-pink-700 font-semibold rounded-lg hover:bg-pink-300 transition">
                  Home
                </button>
              </Link>
            </Form>
          )}
        </Formik>

        <p className="mt-6 text-center text-purple-700">
          Don’t have an account?
          <Link
            to="/register"
            className="text-purple-600 font-medium hover:underline ml-1"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

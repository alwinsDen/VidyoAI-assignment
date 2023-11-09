import "./App.css";
import Editor from "./pages/Editor";
import { ChakraProvider } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";
import React from "react";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <ChakraProvider>
      <ToastContainer />
      <Editor />
    </ChakraProvider>
  );
}

export default App;

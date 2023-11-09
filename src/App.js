import "./App.css";
import Editor from "./pages/Editor";
import { ChakraProvider } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";
import React from "react";

function App() {
  return (
    <ChakraProvider>
      <Editor />
      <ToastContainer />
    </ChakraProvider>
  );
}

export default App;

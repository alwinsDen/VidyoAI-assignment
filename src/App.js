import './App.css';
import Editor from "./pages/Editor";
import {ChakraProvider} from "@chakra-ui/react";

function App() {
  return (
      <ChakraProvider>
        <Editor/>
      </ChakraProvider>
  );
}

export default App;

import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Style components using Tailwind CSS
import "./App.css";
import ChatHistory from "./component/ChatHistory";
import Loading from "./component/Loading";


const App = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // inislize your Gemeni Api
  const genAI = new GoogleGenerativeAI(
    "AIzaSyAJVMOIAJSuu64Ikdkz-1-V5igUXFEANEM"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Function to handle user input
  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  // Function to send user message to Gemini
  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    setIsLoading(true);
    try {
      // call Gemini Api to get a response
      const result = await model.generateContent(userInput);
      const response = await result.response;
      console.log(response);
      // add Gemeni's response to the chat history
      setChatHistory([
        ...chatHistory,
        { type: "user", message: userInput },
        { type: "bot", message: response.text() },
      ]);
    } catch {
      console.error("Error sending message");
    } finally {
      setUserInput("");
      setIsLoading(false);
    }
  };

  // Function to clear the chat history
  const clearChat = () => {
    setChatHistory([]);
  };

  return (
   <>
   <div className="flex justify-center items-center mb-6 pt-8">
  <img className="h-14" src="farm.gif" style={{ width: '160px', height: 'auto' }} />
</div>

<div className="container mx-auto px-4 py-4">
  <h1 className="text-3xl font-bold text-center mb-4">Krishi-bot</h1>

  <div className="chat-container rounded-lg p-4">
    <ChatHistory chatHistory={chatHistory} />
    <Loading isLoading={isLoading} />
  </div>

  <div className="flex mt-4">
    <input
      type="text"
      className="flex-grow px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Type your message..."
      value={userInput}
      onChange={handleUserInput}
    />
    <button
      className="px-4 py-2 ml-2 rounded-lg bg-green-600 text-white hover:bg-green-800 focus:outline-none"
      onClick={sendMessage}
      disabled={isLoading}
    >
      Send
    </button>
  </div>
  <button
    className="mt-4 block px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-800 focus:outline-none"
    onClick={clearChat}
  >
    Clear Chat
  </button>
</div>

</>

  );
};

export default App;

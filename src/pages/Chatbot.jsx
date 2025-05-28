import React, { useState } from 'react';
import useElectionStore from '../../store/useElectionStore';
import { motion } from 'framer-motion';

function Chatbot() {
  const { contract, electionId } = useElectionStore();
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! Ask me anything about elections or results.' }
  ]);
  const [input, setInput] = useState('');

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('result')) {
      try {
        const cands = await contract.getCandidates(electionId);
        const votes = await Promise.all(
          cands.map(async (c) => ({
            name: c,
            votes: Number(await contract.getVotes(electionId, c)),
          }))
        );
        const response = votes.map((v) => `${v.name}: ${v.votes} votes`).join('\n');
        setMessages((prev) => [...prev, { type: 'bot', text: response }]);
      } catch (err) {
        setMessages((prev) => [...prev, { type: 'bot', text: 'Error fetching results.' }]);
      }
    } else if (lowerInput.includes('winner')) {
      try {
        const cands = await contract.getCandidates(electionId);
        const votes = await Promise.all(
          cands.map(async (c) => ({
            name: c,
            votes: Number(await contract.getVotes(electionId, c)),
          }))
        );
        const winner = votes.reduce((max, curr) => (curr.votes > max.votes ? curr : max), votes[0]);
        setMessages((prev) => [...prev, { type: 'bot', text: `🏆 Winner is ${winner.name} with ${winner.votes} votes.` }]);
      } catch (err) {
        setMessages((prev) => [...prev, { type: 'bot', text: 'Unable to determine the winner.' }]);
      }
    } else {
      // Add a "thinking..." message
      setMessages((prev) => [...prev, { type: 'bot', text: '🤔 Thinking...' }]);

      try {
        const res = await fetch('http://localhost:5000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });

        const data = await res.json();

        // Replace the "Thinking..." message with the real response
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { type: 'bot', text: data.reply };
          return updated;
        });
      } catch (err) {
        console.error('AI error:', err);
        setMessages((prev) => [
          ...prev,
          { type: 'bot', text: 'Sorry, I couldn’t process your question right now.' },
        ]);
      }
    }

    setInput('');
  };

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-md p-6 rounded-xl shadow-xl max-w-xl mx-auto mt-10 text-black">
      <h2 className="text-xl font-bold mb-4 text-center text-white">🤖 Election Chatbot</h2>
      <div className="h-64 overflow-y-auto mb-4 bg-white bg-opacity-40 p-4 rounded-lg">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`mb-2 p-2 rounded-lg ${
              msg.type === 'user' ? 'bg-blue-200 text-right' : 'bg-gray-200 text-left'
            }`}
            initial={{ opacity: 0, x: msg.type === 'user' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {msg.text}
          </motion.div>
        ))}
      </div>
      <form onSubmit={handleUserInput} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 rounded-l-lg border border-gray-400 focus:outline-none"
          placeholder="Ask a question..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chatbot;

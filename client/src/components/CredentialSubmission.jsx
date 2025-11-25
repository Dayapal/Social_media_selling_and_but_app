import { CirclePlus, X } from "lucide-react";
import React, { useState } from "react";

const CredentialSubmission = ({ onClose, listing }) => {
  const [newField, setNewField] = useState("");
  const [credential, setCredential] = useState([
    { type: "email", name: "Email", value: "" },
    { type: "password", name: "Password", value: "" },
  ]);

  const handleAddField = () => {
    const name = newField.trim();
    if (!name) return alert("Please enter a field name");

    setCredential((prev) => [
      ...prev,
      { type: "text", name, value: "" },
    ]);

    setNewField("");
  };

  const handleSubmission = (e) => {
    e.preventDefault();
    console.log("Submitted Credentials: ", credential);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-linear-to-r from-indigo-600 to-indigo-400 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">{listing?.title}</h3>
            <p className="text-sm opacity-90">
              Adding credentials for {listing?.username} on {listing?.platform}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmission}
          className="p-4 space-y-4 overflow-y-auto"
        >
          {credential.map((cred, index) => (
            <div
              key={index}
              className="grid grid-cols-[150px_1fr_30px] items-center gap-3"
            >
              <label className="text-sm font-medium text-gray-800">
                {cred.name}
              </label>

              <input
                type={cred.type}
                value={cred.value}
                onChange={(e) =>
                  setCredential((prev) =>
                    prev.map((c, i) =>
                      i === index ? { ...c, value: e.target.value } : c
                    )
                  )
                }
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-indigo-400"
              />

              <X
                onClick={() =>
                  setCredential((prev) => prev.filter((_, i) => i !== index))
                }
                className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer"
              />
            </div>
          ))}

          {/* Add new field */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              placeholder="field name..."
              className="px-2 py-1 border border-gray-300 rounded text-sm outline-indigo-400"
            />
            <button
              type="button"
              onClick={handleAddField}
              className="flex items-center gap-1 text-gray-600 hover:text-black"
            >
              <CirclePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CredentialSubmission;

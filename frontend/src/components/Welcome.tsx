import React, { useState } from 'react';

export default function Welcome({
                                    setNickname,
                                }: {
    setNickname: (nickname: string) => void;
})  {
    const [nicknameValue, setNicknameValue] = useState('');
    const [error, setError] = useState('');

    return (
        <section className="flex justify-center items-center h-screen bg-green-600">
            <div className="max-w-md w-full bg-gray-100 rounded p-6 space-y-4 shadow-lg border border-gray-200/20 backdrop-blur-md">
                <div className="mb-4">
                    <p className="text-gray-600">Sign In</p>
                    <h2 className="text-xl font-bold">Join the Chat</h2>
                </div>
                <div>
                    <input
                        className={`w-full p-4 text-sm bg-gray-200 focus:outline-none border rounded text-gray-950 ${
                            error !== '' ? 'border-red-500' : 'border-gray-200'
                        }`}
                        type="text"
                        placeholder="Nickname"
                        value={nicknameValue}
                        onChange={(e) => setNicknameValue(e.target.value)}
                    />
                    {error !== '' && (
                        <span className="font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">
              {error}
            </span>
                    )}
                </div>
                <div>
                    <button
                        onClick={() => {
                            if (nicknameValue === '') {
                                setError('Nickname cannot be empty');
                                return;
                            }
                            setNickname(nicknameValue);
                        }}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 rounded text-sm font-bold text-white transition duration-200"
                    >
                        Join
                    </button>
                </div>
            </div>
        </section>
    );
}

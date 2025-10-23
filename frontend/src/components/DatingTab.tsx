import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Heart, MessageCircle, User, X, Check, Star, Zap, Upload } from "lucide-react";
import { useCreditScoreContext } from '../hooks/useCreditScoreContext';
import alexMale from '../assets/alex-male.jpg';
import charlieMale from '../assets/charlie-male.jpg';
import frankMale from '../assets/frank-male.jpg';
import sophiaFemale from '../assets/sophia-female.jpg';
import emmaFemale from '../assets/emma-female.jpg';
import dianaFemale from '../assets/diana-female.jpg';
import ryanMale from '../assets/ryan-male.jpg';
import jordanMale from '../assets/jordan-male.jpg';
import taylorMale from '../assets/taylor-male.jpg';
import rileyFemale from '../assets/riley-female.jpg';
import caseyFemale from '../assets/casey-female.jpg';
import morganFemale from '../assets/morgan-female.jpg';

interface Profile {
  name: string;
  age: number;
  about: string;
  favoriteApp: string;
  gender: string;
  preference: string;
  photo?: string;
  creditScore: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'match';
  timestamp: Date;
}

interface Match extends Profile {
  id: string;
  messages: Message[];
}

export const DatingTab: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Profile>({
    name: "",
    age: 18,
    about: "",
    favoriteApp: "",
    gender: "",
    preference: "",
    creditScore: 0,
  });
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [index, setIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'discover' | 'matches'>('discover');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);

  // Use the credit score context
  const { calculatedScore, isRealScore } = useCreditScoreContext();
  
  // Use calculated score if available, otherwise use fallback score
  const displayScore = isRealScore ? calculatedScore : 650;
  
  // Handle NaN and invalid scores
  const isValidScore = !isNaN(displayScore) && isFinite(displayScore) && displayScore >= 300 && displayScore <= 850;
  const finalScore = isValidScore ? Math.round(displayScore) : 650;

  // All available profiles - exactly 3 for each combination
  const allProfiles: Match[] = [
    // Male profiles looking for females
    {
      id: "m1",
      name: "Alex",
      age: 29,
      about: "DeFi developer building innovative protocols. Love discussing tokenomics.",
      favoriteApp: "Morpho",
      gender: "male",
      preference: "female",
      photo: alexMale,
      creditScore: 812,
      messages: []
    },
    {
      id: "m2",
      name: "Charlie",
      age: 31,
      about: "Crypto trader and protocol researcher. Always early to new DeFi innovations.",
      favoriteApp: "Curve Finance",
      gender: "male",
      preference: "female",
      photo: charlieMale,
      creditScore: 783,
      messages: []
    },
    {
      id: "m3",
      name: "Frank",
      age: 33,
      about: "DeFi maximalist and protocol auditor. Security first in everything.",
      favoriteApp: "Lido Finance",
      gender: "male",
      preference: "female",
      photo: frankMale,
      creditScore: 856,
      messages: []
    },

    // Female profiles looking for males
    {
      id: "f1",
      name: "Sophia",
      age: 26,
      about: "NFT artist and DeFi enthusiast. Love exploring new protocols and building in web3.",
      favoriteApp: "Aave",
      gender: "female",
      preference: "male",
      photo: sophiaFemale,
      creditScore: 745,
      messages: []
    },
    {
      id: "f2",
      name: "Emma",
      age: 27,
      about: "Yield farmer and liquidity provider. Passionate about finding the best APYs.",
      favoriteApp: "Uniswap V3",
      gender: "female",
      preference: "male",
      photo: emmaFemale,
      creditScore: 698,
      messages: []
    },
    {
      id: "f3",
      name: "Diana",
      age: 25,
      about: "Web3 designer and DAO contributor. Building beautiful interfaces for DeFi.",
      favoriteApp: "Compound",
      gender: "female",
      preference: "male",
      photo: dianaFemale,
      creditScore: 721,
      messages: []
    },

    // Male profiles looking for males
    {
      id: "mm1",
      name: "Ryan",
      age: 32,
      about: "Institutional DeFi analyst. Bridging traditional finance with crypto.",
      favoriteApp: "Synthetix",
      gender: "male",
      preference: "male",
      photo: ryanMale,
      creditScore: 801,
      messages: []
    },
    {
      id: "mm2",
      name: "Jordan",
      age: 29,
      about: "Cross-chain developer. Building bridges between different blockchain ecosystems.",
      favoriteApp: "LayerZero",
      gender: "male",
      preference: "male",
      photo: jordanMale,
      creditScore: 732,
      messages: []
    },
    {
      id: "mm3",
      name: "Taylor",
      age: 30,
      about: "Crypto fund manager and investment strategist. Focused on long-term growth.",
      favoriteApp: "Yearn Finance",
      gender: "male",
      preference: "male",
      photo: taylorMale,
      creditScore: 789,
      messages: []
    },

    // Female profiles looking for females
    {
      id: "ff1",
      name: "Riley",
      age: 28,
      about: "Blockchain researcher and academic. Studying crypto economics and governance.",
      favoriteApp: "Compound Governance",
      gender: "female",
      preference: "female",
      photo: rileyFemale,
      creditScore: 768,
      messages: []
    },
    {
      id: "ff2",
      name: "Casey",
      age: 26,
      about: "Smart contract developer and security expert. Passionate about safe DeFi.",
      favoriteApp: "Aave V3",
      gender: "female",
      preference: "female",
      photo: caseyFemale,
      creditScore: 815,
      messages: []
    },
    {
      id: "ff3",
      name: "Morgan",
      age: 27,
      about: "DeFi educator and community builder. Helping newcomers navigate web3 safely.",
      favoriteApp: "Uniswap",
      gender: "female",
      preference: "female",
      photo: morganFemale,
      creditScore: 694,
      messages: []
    }
  ];

  const [matches, setMatches] = useState<Match[]>([]);

  // Filter profiles based on user's gender and preference
  const filteredProfiles = useMemo(() => {
    if (!profile) return [];
    
    return allProfiles.filter(matchProfile => {
      return profile.preference === matchProfile.gender && 
             matchProfile.preference === profile.gender;
    });
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedRules) {
      alert("Please accept the CreditCupid ethics agreement.");
      return;
    }
    setProfile({ ...formData, creditScore: finalScore });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwipe = (like: boolean) => {
    setSwipeAnimation(like ? 'right' : 'left');
    
    setTimeout(() => {
      if (like && filteredProfiles[index]) {
        const newMatch = filteredProfiles[index];
        setMatches(prev => [...prev, newMatch]);
      }

      if (index + 1 < filteredProfiles.length) {
        setIndex(index + 1);
      } else {
        setIndex(0);
      }
      setSwipeAnimation(null);
    }, 300);
  };

  const sendMessage = (matchId: string, text: string) => {
    if (!text.trim()) return;
    
    setMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        const newMessage: Message = {
          id: `${matchId}-${Date.now()}`,
          text,
          sender: 'user',
          timestamp: new Date()
        };
        return {
          ...match,
          messages: [...match.messages, newMessage]
        };
      }
      return match;
    }));

    setMessageInput('');
    
    setTimeout(() => {
      setMatches(prev => prev.map(match => {
        if (match.id === matchId) {
          const replies = [
            "That's interesting! Tell me more about your experience with DeFi.",
            "I love discussing crypto strategies! What's your approach?",
            "Great point! Have you tried any of the newer protocols?",
            "Fascinating! I've been exploring similar concepts lately.",
            "We should compare notes on our favorite protocols sometime!"
          ];
          const autoReply: Message = {
            id: `${matchId}-${Date.now()}-reply`,
            text: replies[Math.floor(Math.random() * replies.length)],
            sender: 'match',
            timestamp: new Date()
          };
          return {
            ...match,
            messages: [...match.messages, autoReply]
          };
        }
        return match;
      }));
    }, 2000);
  };

  const getCreditScoreDisplay = (score: number) => {
    if (score < 600) return { 
      text: "CREDIT ROOKIE", 
      color: "text-red-500", 
      bg: "bg-red-100", 
      emoji: "🌱",
      border: "border-red-300"
    };
    if (score < 700) return { 
      text: "MODERATE PROFILE", 
      color: "text-yellow-600", 
      bg: "bg-yellow-100", 
      emoji: "📈",
      border: "border-yellow-300"
    };
    if (score < 800) return { 
      text: "STRONG PROFILE", 
      color: "text-green-600", 
      bg: "bg-green-100", 
      emoji: "💪",
      border: "border-green-300"
    };
    return { 
      text: "EXCELLENT CREDITCUPID MATCH!", 
      color: "text-blue-600", 
      bg: "bg-blue-100", 
      emoji: "🚀",
      border: "border-blue-300"
    };
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-start py-2 font-vt323">
        <Card className="max-w-md w-full border-4 border-white bg-gradient-to-br from-blue-50 to-pink-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
<CardHeader className="pb-2 text-center">
  <div className="flex justify-center items-center gap-2 mb-2">
    <Heart className="h-6 w-6 text-blue-600" />
  </div>
  <CardTitle className="text-xl text-blue-800 bg-white/80 rounded-lg py-1 px-3 border-2 border-blue-300 inline-block">
    CREATE PROFILE
  </CardTitle>
</CardHeader>
          <CardContent className="p-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  required
                  type="number"
                  className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                />
              </div>

              <textarea
                required
                className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                placeholder="About me..."
                rows={2}
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              />

              <input
                required
                className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                placeholder="Favorite web3 product"
                value={formData.favoriteApp}
                onChange={(e) => setFormData({ ...formData, favoriteApp: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  required
                  className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <select
                  required
                  className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                  value={formData.preference}
                  onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
                >
                  <option value="">Looking for</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">PROFILE PHOTO</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-gray-400 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors bg-white/90">
                    <Upload className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                    <span className="text-xs text-gray-600">Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  {formData.photo && (
                    <img
                      src={formData.photo}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover border-2 border-green-400"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-blue-100/80 rounded-lg border-2 border-blue-300">
                <input
                  type="checkbox"
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500 mt-0.5"
                />
                <label className="text-xs text-blue-800 leading-tight">
                  Accept CREDITCUPID Ethics: Respect & Kindness
                </label>
              </div>
<Button
  type="submit"
  className="w-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-sm py-2 font-bold transition-transform hover:scale-105"
>
  CREATE PROFILE
</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = filteredProfiles[index];
  const scoreDisplay = getCreditScoreDisplay(profile.creditScore);
  const userScoreDisplay = getCreditScoreDisplay(finalScore);

  return (
    <div className="p-3 space-y-3 font-vt323 max-w-4xl mx-auto">
      {/* Profile Header - Ultra Compact */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-100 to-pink-100 rounded-2xl p-3 border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3">
          {profile.photo && (
            <img
              src={profile.photo}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-pink-400 shadow-lg"
            />
          )}
          <div>
            <p className="font-bold text-blue-800 text-sm">{profile.name}, {profile.age}</p>
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${userScoreDisplay.bg} ${userScoreDisplay.color} border ${userScoreDisplay.border}`}>
              {userScoreDisplay.emoji} {finalScore} • {userScoreDisplay.text}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
              activeTab === 'discover' 
                ? 'bg-pink-500 text-white border-pink-600' 
                : 'bg-white text-gray-600 border-gray-400 hover:bg-gray-100'
            }`}
          >
            🔍 {filteredProfiles.length}
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
              activeTab === 'matches' 
                ? 'bg-green-500 text-white border-green-600' 
                : 'bg-white text-gray-600 border-gray-400 hover:bg-gray-100'
            }`}
          >
            💬 {matches.length}
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'discover' && (
        <div className="relative">
          {current ? (
            <div className={`transition-all duration-300 ${
              swipeAnimation === 'left' ? 'transform -translate-x-full opacity-0' :
              swipeAnimation === 'right' ? 'transform translate-x-full opacity-0' : ''
            }`}>
              <Card className="border-4 border-white bg-gradient-to-br from-white to-blue-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    {/* Profile Image */}
                    <div className="relative">
                      <img
                        src={current.photo}
                        alt={current.name}
                        className="w-32 h-32 rounded-2xl object-cover mx-auto border-4 border-pink-400 shadow-lg"
                      />
                      <div className={`absolute -top-2 -right-2 ${getCreditScoreDisplay(current.creditScore).bg} ${getCreditScoreDisplay(current.creditScore).color} text-xs font-bold px-2 py-1 rounded-full border-2 border-white`}>
                        {getCreditScoreDisplay(current.creditScore).emoji} {current.creditScore}
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div>
                      <h3 className="text-xl font-bold text-blue-800">{current.name}, {current.age}</h3>
                      <div className={`my-2 px-3 py-1 rounded-full ${getCreditScoreDisplay(current.creditScore).bg} ${getCreditScoreDisplay(current.creditScore).border} border-2`}>
                        <span className={`text-xs font-bold ${getCreditScoreDisplay(current.creditScore).color}`}>
                          {getCreditScoreDisplay(current.creditScore).text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{current.about}</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-blue-600">{current.favoriteApp}</span>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>

                    {/* Swipe Buttons */}
                    <div className="flex justify-center gap-6 pt-2">
                      <button
                        onClick={() => handleSwipe(false)}
                        className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform"
                      >
                        <X className="h-6 w-6 text-white" />
                      </button>
                      <button
                        onClick={() => handleSwipe(true)}
                        className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform"
                      >
                        <Check className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-4 border-white bg-gradient-to-br from-yellow-50 to-orange-50 text-center p-6">
              <div className="text-4xl mb-2">🎯</div>
              <p className="font-bold text-blue-800">No matches found!</p>
              <p className="text-sm text-gray-600">Adjust your preferences to see more profiles</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <Card className="border-4 border-white bg-gradient-to-br from-green-50 to-blue-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardContent className="p-3">
            {matches.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">💫</div>
                <p className="font-bold text-blue-800">No matches yet!</p>
                <p className="text-sm text-gray-600">Start swiping to find connections</p>
              </div>
            ) : selectedMatch ? (
              <div className="space-y-3">
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-green-400">
                  <img
                    src={selectedMatch.photo}
                    alt={selectedMatch.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-green-400"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-800 text-sm">{selectedMatch.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-600">{selectedMatch.favoriteApp}</p>
                      <span className={`text-xs px-1 rounded ${getCreditScoreDisplay(selectedMatch.creditScore).bg} ${getCreditScoreDisplay(selectedMatch.creditScore).color}`}>
                        {selectedMatch.creditScore}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ←
                  </button>
                </div>

                {/* Messages */}
                <div className="h-48 overflow-y-auto space-y-2 p-3 bg-white/80 rounded-xl border-2 border-gray-300">
                  {selectedMatch.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-2xl border-2 ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white text-gray-800 border-gray-400'
                        } shadow-sm`}
                      >
                        <p className="text-xs">{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedMatch.id, messageInput)}
                    placeholder="Type a message..."
                    className="flex-1 border-2 border-gray-400 rounded-xl p-2 text-sm focus:outline-none focus:border-green-500 bg-white"
                  />
                  <Button
                    onClick={() => sendMessage(selectedMatch.id, messageInput)}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-2 border-white px-4 text-sm font-bold"
                  >
                    Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-xl p-2 border-2 border-pink-300 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={match.photo}
                        alt={match.name}
                        className="w-8 h-8 rounded-full object-cover border border-pink-400"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 text-xs">{match.name}</h3>
                        <div className={`text-xs px-1 rounded ${getCreditScoreDisplay(match.creditScore).bg} ${getCreditScoreDisplay(match.creditScore).color}`}>
                          {match.creditScore} • {getCreditScoreDisplay(match.creditScore).text.split(' ')[0]}
                        </div>
                      </div>
                      <MessageCircle className="h-3 w-3 text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Heart, MessageCircle, User, X, Check, Star, Zap, Upload, Sparkles, Coins, Castle, Info } from "lucide-react";
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
  web3Personality: string;
  gender: string;
  preference: string;
  photo?: string;
  creditScore: number;
  web3Vibes?: {
    degenLevel: number;
    favoriteDapps: string[];
  };
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

// Honest Web3 Vibes Generator - Based on credit score patterns only
const generateWeb3Vibes = (creditScore: number) => {
  // These are ESTIMATES based on credit score patterns, not actual on-chain analysis
  
  // Credit score based dapp preferences (educated guesses)
  const defiDapps = ["Uniswap", "Aave", "Compound", "Curve", "Lido", "Maker"];
  const nftDapps = ["OpenSea", "Blur", "Zora", "Foundation"];
  const socialDapps = ["Friendtech", "Farcaster", "Lens"];
  const infrastructure = ["Arbitrum", "Optimism", "Polygon", "Base", "ENS"];
  
  let dappPool;
  if (creditScore >= 800) {
    dappPool = [...defiDapps, ...infrastructure]; // Typically more sophisticated users
  } else if (creditScore >= 700) {
    dappPool = [...defiDapps, ...nftDapps, ...infrastructure]; // Balanced usage
  } else if (creditScore >= 600) {
    dappPool = [...nftDapps, ...socialDapps, ...defiDapps.slice(0, 2)]; // More social/NFT focused
  } else {
    dappPool = [...socialDapps, ...nftDapps]; // New users often start with social/NFTs
  }

  // Degen level ESTIMATE based on credit score correlation
  // Lower credit scores often correlate with higher risk-taking in our data
  const degenLevel = Math.min(100, Math.max(20, 
    creditScore < 580 ? 75 + Math.random() * 20 : // Higher risk estimate
    creditScore < 670 ? 60 + Math.random() * 25 : // Medium-high risk
    creditScore < 740 ? 40 + Math.random() * 30 : // Balanced
    creditScore < 800 ? 25 + Math.random() * 35 : // Conservative
    15 + Math.random() * 25 // Very conservative
  ));

  return {
    degenLevel: Math.round(degenLevel),
    favoriteDapps: [...dappPool].sort(() => Math.random() - 0.5).slice(0, 3),
  };
};

export const DatingTab: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Profile>({
    name: "",
    age: 18,
    about: "",
    web3Personality: "",
    gender: "",
    preference: "",
    creditScore: 0,
  });
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [index, setIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'discover' | 'matches' | 'vibes'>('discover');
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

  // creditcupid rating system
  const getCreditScoreDisplay = (score: number) => {
    if (score < 580) return { 
      text: "WEN MOON?", 
      color: "text-gray-500", 
      bg: "bg-gray-100", 
      emoji: "🌑",
      border: "border-gray-300",
      description: "Love rocket still launching"
    };
    if (score < 670) return { 
      text: "STABLE COIN HEART", 
      color: "text-green-600", 
      bg: "bg-green-100", 
      emoji: "💹",
      border: "border-green-300",
      description: "Reliable & predictable"
    };
    if (score < 740) return { 
      text: "ALTS SEASON READY", 
      color: "text-blue-600", 
      bg: "bg-blue-100", 
      emoji: "📈",
      border: "border-blue-300",
      description: "High growth potential"
    };
    if (score < 800) return { 
      text: "WHALE CURVES", 
      color: "text-purple-600", 
      bg: "bg-purple-100", 
      emoji: "🐋",
      border: "border-purple-300",
      description: "Big moves energy"
    };
    return { 
      text: "MAINNET MARRIAGE", 
      color: "text-yellow-600", 
      bg: "bg-yellow-100", 
      emoji: "💍",
      border: "border-yellow-300",
      description: "Production-ready partner"
    };
  };

  // All available profiles - exactly 3 for each combination
  const allProfiles: Match[] = [
    // Male profiles looking for females
    {
      id: "m1",
      name: "Alex",
      age: 29,
      about: "DeFi developer building innovative protocols. Love discussing tokenomics.",
      web3Personality: "Would sacrifice a goat for 1000% APY",
      gender: "male",
      preference: "female",
      photo: alexMale,
      creditScore: 812,
      web3Vibes: generateWeb3Vibes(812),
      messages: []
    },
    {
      id: "m2",
      name: "Charlie",
      age: 31,
      about: "Crypto trader and protocol researcher. Always early to new DeFi innovations.",
      web3Personality: "My love language is 'GM' in all caps",
      gender: "male",
      preference: "female",
      photo: charlieMale,
      creditScore: 783,
      web3Vibes: generateWeb3Vibes(783),
      messages: []
    },
    {
      id: "m3",
      name: "Frank",
      age: 33,
      about: "DeFi maximalist and protocol auditor. Security first in everything.",
      web3Personality: "I check DeFi Llama more than my texts",
      gender: "male",
      preference: "female",
      photo: frankMale,
      creditScore: 856,
      web3Vibes: generateWeb3Vibes(856),
      messages: []
    },

    // Female profiles looking for males
    {
      id: "f1",
      name: "Sophia",
      age: 26,
      about: "NFT artist and DeFi enthusiast. Love exploring new protocols and building in web3.",
      web3Personality: "I'd rather get rugged than ghosted",
      gender: "female",
      preference: "male",
      photo: sophiaFemale,
      creditScore: 745,
      web3Vibes: generateWeb3Vibes(745),
      messages: []
    },
    {
      id: "f2",
      name: "Emma",
      age: 27,
      about: "Yield farmer and liquidity provider. Passionate about finding the best APYs.",
      web3Personality: "My exes are like bad tokens - I don't hold them",
      gender: "female",
      preference: "male",
      photo: emmaFemale,
      creditScore: 698,
      web3Vibes: generateWeb3Vibes(698),
      messages: []
    },
    {
      id: "f3",
      name: "Diana",
      age: 25,
      about: "Web3 designer and DAO contributor. Building beautiful interfaces for DeFi.",
      web3Personality: "I love you more than I love claiming airdrops",
      gender: "female",
      preference: "male",
      photo: dianaFemale,
      creditScore: 721,
      web3Vibes: generateWeb3Vibes(721),
      messages: []
    },

    // Male profiles looking for males
    {
      id: "mm1",
      name: "Ryan",
      age: 32,
      about: "Institutional DeFi analyst. Bridging traditional finance with crypto.",
      web3Personality: "My heart has better tokenomics than most L2s",
      gender: "male",
      preference: "male",
      photo: ryanMale,
      creditScore: 801,
      web3Vibes: generateWeb3Vibes(801),
      messages: []
    },
    {
      id: "mm2",
      name: "Jordan",
      age: 29,
      about: "Cross-chain developer. Building bridges between different blockchain ecosystems.",
      web3Personality: "I'm more loyal than a Bitcoin maximalist",
      gender: "male",
      preference: "male",
      photo: jordanMale,
      creditScore: 732,
      web3Vibes: generateWeb3Vibes(732),
      messages: []
    },
    {
      id: "mm3",
      name: "Taylor",
      age: 30,
      about: "Crypto fund manager and investment strategist. Focused on long-term growth.",
      web3Personality: "Wen romance? Soon™",
      gender: "male",
      preference: "male",
      photo: taylorMale,
      creditScore: 789,
      web3Vibes: generateWeb3Vibes(789),
      messages: []
    },

    // Female profiles looking for females
    {
      id: "ff1",
      name: "Riley",
      age: 28,
      about: "Blockchain researcher and academic. Studying crypto economics and governance.",
      web3Personality: "My love is more decentralized than most DAOs",
      gender: "female",
      preference: "female",
      photo: rileyFemale,
      creditScore: 768,
      web3Vibes: generateWeb3Vibes(768),
      messages: []
    },
    {
      id: "ff2",
      name: "Casey",
      age: 26,
      about: "Smart contract developer and security expert. Passionate about safe DeFi.",
      web3Personality: "I'd audit your heart for free",
      gender: "female",
      preference: "female",
      photo: caseyFemale,
      creditScore: 815,
      web3Vibes: generateWeb3Vibes(815),
      messages: []
    },
    {
      id: "ff3",
      name: "Morgan",
      age: 27,
      about: "DeFi educator and community builder. Helping newcomers navigate web3 safely.",
      web3Personality: "Love at first sight? More like love at first GM",
      gender: "female",
      preference: "female",
      photo: morganFemale,
      creditScore: 694,
      web3Vibes: generateWeb3Vibes(694),
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
    setProfile({ 
      ...formData, 
      creditScore: finalScore,
      web3Vibes: generateWeb3Vibes(finalScore)
    });
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

  const userScoreDisplay = getCreditScoreDisplay(finalScore);

  // Funny Web3 personality options
  const web3PersonalityOptions = [
    "Would sacrifice a goat for 1000% APY",
    "My love language is 'GM' in all caps",
    "I check DeFi Llama more than my texts",
    "I'd rather get rugged than ghosted",
    "My exes are like bad tokens - I don't hold them",
    "I love you more than I love claiming airdrops",
    "My heart has better tokenomics than most L2s",
    "I'm more loyal than a Bitcoin maximalist",
    "Wen romance? Soon™",
    "My love is more decentralized than most DAOs",
    "I'd audit your heart for free",
    "Love at first sight? More like love at first GM",
    "Diamond hands only, no paper hearts",
    "I'm here for the technology... and the romance",
    "My emotional intelligence is over 9000 (like gas fees)",
    "I promise I won't rug your heart",
    "Looking for someone to build a life DAO with",
    "My love is permissionless and trustless",
    "Swipe right if you understand 'WAGMI'",
    "Let's create some beautiful onchain memories"
  ];

  // Honest Web3 Vibes Analysis Component
  const Web3VibesAnalysis: React.FC<{ match: Match }> = ({ match }) => {
    // WEB3 SOUL CONNECTION Calculation (real - based on available data)
    const calculateCompatibility = () => {
      const scoreDiff = Math.abs(finalScore - match.creditScore);
      const baseCompatibility = Math.max(30, 100 - scoreDiff / 5);
      const personalityBonus = match.web3Personality.includes("GM") && profile?.web3Personality.includes("GM") ? 15 : 0;
      return Math.min(99, baseCompatibility + personalityBonus);
    };

    const compatibility = calculateCompatibility();

    return (
      <div className="space-y-3">
        {/* Honest Disclaimer */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border-2 border-blue-300">
          <div className="flex items-start gap-2 text-xs text-blue-700">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Privacy First:</span> We estimate web3 patterns from credit scores, your wallet address is never revealed
            </div>
          </div>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Web3 Soul Connection */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 text-white text-center border-2 border-white shadow-lg col-span-2">
            <div className="text-xs opacity-90 mb-1">WEB3 SOUL CONNECTION</div>
            <div className="text-2xl font-bold mb-1">{compatibility}%</div>
            <div className="text-xs opacity-90">
              {compatibility >= 85 ? "Legendary! 🚀" : 
               compatibility >= 70 ? "Strong! 💫" : 
               compatibility >= 60 ? "Good vibes! ✨" : 
               "Potential! 🌱"}
            </div>
          </div>

          {/* Financial Personality */}
          <div className="bg-white rounded-xl p-3 border-2 border-blue-300 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <div className="text-xs font-bold text-blue-800">FINANCIAL VIBES</div>
            </div>
            <div className="text-center">
              <div className={`text-lg mb-1 ${getCreditScoreDisplay(match.creditScore).color}`}>
                {getCreditScoreDisplay(match.creditScore).emoji} {match.creditScore}
              </div>
              <div className="text-xs text-gray-600">{getCreditScoreDisplay(match.creditScore).text}</div>
            </div>
          </div>

          {/* Degen Level */}
          {match.web3Vibes && (
            <div className="bg-white rounded-xl p-3 border-2 border-yellow-300 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-yellow-600" />
                <div className="text-xs font-bold text-yellow-800">RISK ESTIMATE</div>
              </div>
              <div className="space-y-1">
                <div className="text-center text-sm font-bold text-yellow-700">{match.web3Vibes.degenLevel}/100</div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${match.web3Vibes.degenLevel}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-center">Based on credit patterns</div>
              </div>
            </div>
          )}

          {/* Favorite Realms */}
          {match.web3Vibes && (
            <div className="bg-white rounded-xl p-3 border-2 border-green-300 shadow-sm col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Castle className="h-4 w-4 text-green-600" />
                <div className="text-xs font-bold text-green-800">LIKELY INTERESTS</div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {match.web3Vibes.favoriteDapps.map((dapp, index) => (
                  <div key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-300">
                    {dapp}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">Estimated from credit profile</div>
            </div>
          )}
        </div>

        {/* Honest Calculation Explanations */}
        <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-300">
          <div className="text-xs font-bold text-gray-700 mb-1">HOW WE ESTIMATE:</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• <strong>Soul Connection:</strong> Real calculation based on your credit scores + personality match</div>
            <div>• <strong>Risk Estimate:</strong> Pattern-based estimate from credit behavior correlations</div>
            <div>• <strong>Likely Interests:</strong> Educated guesses based on credit score patterns</div>
          </div>
        </div>
      </div>
    );
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
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Compact Personal Info Section */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">NAME</label>
                  <input
                    required
                    className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">AGE</label>
                  <input
                    required
                    type="number"
                    className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="18"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* About Me - Compact */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ABOUT ME</label>
                <textarea
                  required
                  className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Tell us about yourself..."
                  rows={2}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                />
              </div>

              {/* Web3 Personality - Compact */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WEB3 PERSONALITY VIBES</label>
                <select
                  required
                  className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                  value={formData.web3Personality}
                  onChange={(e) => setFormData({ ...formData, web3Personality: e.target.value })}
                >
                  <option value="">Choose your crypto personality...</option>
                  {web3PersonalityOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This is way more important than your star sign
                </p>
              </div>

              {/* Gender & Preference - Compact */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">GENDER</label>
                  <select
                    required
                    className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">LOOKING FOR</label>
                  <select
                    required
                    className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm bg-white/90 focus:outline-none focus:border-blue-500 focus:bg-white"
                    value={formData.preference}
                    onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload - Compact */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">PROFILE PHOTO</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 border-2 border-dashed border-gray-400 rounded-lg p-2 text-center cursor-pointer hover:border-blue-500 transition-colors bg-white/90">
                    <Upload className="h-3 w-3 mx-auto mb-1 text-gray-500" />
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
                      className="w-10 h-10 rounded-lg object-cover border-2 border-green-400"
                    />
                  )}
                </div>
              </div>

              {/* Credit Score Preview - Compact */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 border-2 border-blue-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800">YOUR CREDIT SCORE:</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${userScoreDisplay.bg} ${userScoreDisplay.color} border ${userScoreDisplay.border}`}>
                    {userScoreDisplay.emoji} {finalScore}
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  This will be visible to potential matches and affect your compatibility scores
                </p>
              </div>

              {/* Ethics Agreement - Compact */}
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

              {/* Submit Button */}
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

  return (
    <div className="p-3 space-y-3 font-vt323 max-w-4xl mx-auto">
      {/* Profile Header - Enhanced with Vibes Tab */}
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
          <button
            onClick={() => setActiveTab('vibes')}
            className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
              activeTab === 'vibes' 
                ? 'bg-purple-500 text-white border-purple-600' 
                : 'bg-white text-gray-600 border-gray-400 hover:bg-gray-100'
            }`}
          >
            ⚡ Vibes
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
                        <span className="text-sm font-semibold text-blue-600 italic">"{current.web3Personality}"</span>
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
                      <p className="text-xs text-gray-600 italic">"{selectedMatch.web3Personality}"</p>
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

      {activeTab === 'vibes' && selectedMatch && (
        <Card className="border-4 border-white bg-gradient-to-br from-purple-50 to-pink-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              WEB3 VIBES ANALYSIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Web3VibesAnalysis match={selectedMatch} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'vibes' && !selectedMatch && matches.length > 0 && (
        <Card className="border-4 border-white bg-gradient-to-br from-purple-50 to-pink-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-2">🔮</div>
            <p className="font-bold text-purple-800">Select a match to analyze their Web3 vibes!</p>
            <p className="text-sm text-gray-600 mt-1">Choose someone from your matches to see your compatibility</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'vibes' && matches.length === 0 && (
        <Card className="border-4 border-white bg-gradient-to-br from-purple-50 to-pink-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-2">💫</div>
            <p className="font-bold text-purple-800">No matches to analyze yet!</p>
            <p className="text-sm text-gray-600 mt-1">Start swiping to discover Web3 soul connections</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
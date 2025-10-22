import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Heart } from "lucide-react";

interface Profile {
  name: string;
  age: number;
  about: string;
  favoriteApp: string;
  gender: string;
  preference: string;
  photo?: string;
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
  });
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [index, setIndex] = useState(0);

  const mockMatches: Profile[] = [
    {
      name: "Alice",
      age: 26,
      about: "NFT artist",
      favoriteApp: "Aave",
      gender: "female",
      preference: "male",
      photo: "/assets/demo1.jpg",
    },
    {
      name: "Bob",
      age: 29,
      about: "DeFi developer",
      favoriteApp: "Morpho",
      gender: "male",
      preference: "female",
      photo: "/assets/demo2.jpg",
    },
    {
      name: "Eve",
      age: 27,
      about: "Yield farmer",
      favoriteApp: "Uniswap",
      gender: "female",
      preference: "bi",
      photo: "/assets/demo3.jpg",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedRules) {
      alert("Please accept the CreditCupid ethics agreement.");
      return;
    }
    setProfile({ ...formData });
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
    if (like) {
      alert(`You liked ${mockMatches[index].name}! 💕`);
    }

    if (index + 1 < mockMatches.length) {
      setIndex(index + 1);
    } else {
      alert("That’s all matches for now!");
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-8 font-vt323">
        <Card className="max-w-lg w-full border-4 border-white bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
              <Heart className="h-5 w-5 text-pink-500" /> CREATE YOUR DATING
              PROFILE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                className="w-full border-2 border-gray-400 rounded p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                required
                type="number"
                className="w-full border-2 border-gray-400 rounded p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                placeholder="Age"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: Number(e.target.value) })
                }
              />
              <textarea
                required
                className="w-full border-2 border-gray-400 rounded p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                placeholder="About Me"
                value={formData.about}
                onChange={(e) =>
                  setFormData({ ...formData, about: e.target.value })
                }
              />
              <input
                required
                className="w-full border-2 border-gray-400 rounded p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                placeholder="Favorite Web3 Protocol"
                value={formData.favoriteApp}
                onChange={(e) =>
                  setFormData({ ...formData, favoriteApp: e.target.value })
                }
              />
              <div className="flex gap-4">
                <select
                  required
                  className="w-1/2 border-2 border-gray-400 rounded p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <select
                  required
                  className="w-1/2 border-2 border-gray-400 rounded p-2 text-sm bg-white focus:outline-none focus:border-blue-500"
                  value={formData.preference}
                  onChange={(e) =>
                    setFormData({ ...formData, preference: e.target.value })
                  }
                >
                  <option value="">Looking For</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="bi">Bi</option>
                </select>
              </div>

              <input
                type="file"
                accept="image/*"
                className="w-full p-2 text-sm border-2 border-gray-400 rounded bg-white"
                onChange={handleFileUpload}
              />

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-400">
                <input
                  type="checkbox"
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-blue-800">
                  I ACCEPT THE CREDITCUPID ETHICS AGREEMENT: RESPECT, KINDNESS,
                  AND ZERO HARASSMENT.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-pink-500 text-white hover:bg-pink-600 border-2 border-pink-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] text-sm"
              >
                CREATE PROFILE
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = mockMatches[index];

  return (
    <div className="p-6 space-y-6 font-vt323">
      <Card className="border-4 border-white bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
            <Heart className="h-5 w-5 text-pink-500" /> YOUR CREDITCUPID PROFILE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 items-center">
            {profile.photo && (
              <img
                src={profile.photo}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-pink-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              />
            )}
            <div>
              <p className="text-lg font-semibold text-blue-800">
                {profile.name}, {profile.age}
              </p>
              <p className="text-sm text-gray-700">{profile.about}</p>
              <p className="text-sm mt-2 text-blue-600">
                FAVORITE PROTOCOL: {profile.favoriteApp}
              </p>
              <p className="mt-2 text-xs text-pink-700 italic bg-pink-50 p-2 rounded border border-pink-200">
                VERIFIED BY CREDITCUPID — ONLY CREDIT SCORE, NEVER SENSITIVE
                DETAILS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-4 border-white bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
            <Heart className="h-5 w-5 text-pink-500" /> DISCOVER MATCHES
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {current ? (
            <div>
              <img
                src={current.photo}
                alt={current.name}
                className="w-64 h-64 rounded-2xl object-cover mx-auto border-4 border-pink-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
              />
              <h3 className="mt-4 text-xl font-semibold text-blue-800">
                {current.name}, {current.age}
              </h3>
              <p className="text-sm text-gray-700">{current.about}</p>
              <p className="text-sm text-blue-600 mt-2">
                FAVORITE: {current.favoriteApp}
              </p>
              <div className="flex justify-center gap-6 mt-6">
                <button
                  onClick={() => handleSwipe(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl p-3 bg-gray-100 rounded-full border-2 border-gray-400 hover:bg-gray-200 transition-colors"
                >
                  💔
                </button>
                <button
                  onClick={() => handleSwipe(true)}
                  className="text-pink-500 hover:text-pink-600 text-3xl p-3 bg-pink-100 rounded-full border-2 border-pink-400 hover:bg-pink-200 transition-colors"
                >
                  💖
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <p className="text-gray-600 text-lg">NO MORE MATCHES YET!</p>
              <p className="text-sm text-gray-500 mt-2">
                CHECK BACK LATER FOR NEW CONNECTIONS.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Heart } from 'lucide-react';

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
    name: '',
    age: 18,
    about: '',
    favoriteApp: '',
    gender: '',
    preference: '',
  });
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedRules) {
      alert('Please accept CreditCupid ethics agreement.');
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

  // Mock matches for demo, you can replace with real API data later
  const mockMatches: Profile[] = [
    { name: 'Alice', age: 26, about: 'NFT artist', favoriteApp: 'Aave', gender: 'female', preference: 'male', photo: '/assets/demo1.jpg' },
    { name: 'Bob', age: 29, about: 'DeFi developer', favoriteApp: 'Morpho', gender: 'male', preference: 'female', photo: '/assets/demo2.jpg' },
    { name: 'Eve', age: 27, about: 'Yield farmer', favoriteApp: 'Uniswap', gender: 'female', preference: 'bi', photo: '/assets/demo3.jpg' },
  ];

  const handleSwipe = (like: boolean) => {
    if (like) alert(`You liked ${mockMatches[index].name}! 💕`);
    if (index + 1 < mockMatches.length) setIndex(index + 1);
    else alert('That’s all matches for now!');
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-8">
        <Card className="max-w-lg w-full bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" /> Create Your Dating Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                className="w-full border rounded p-2"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                required
                type="number"
                className="w-full border rounded p-2"
                placeholder="Age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              />
              <textarea
                required
                className="w-full border rounded p-2"
                placeholder="About Me"
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              />
              <input
                required
                className="w-full border rounded p-2"
                placeholder="Favorite Web3 Protocol"
                value={formData.favoriteApp}
                onChange={(e) => setFormData({ ...formData, favoriteApp: e.target.value })}
              />
              <div className="flex gap-4">
                <select
                  required
                  className="w-1/2 border rounded p-2"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <select
                  required
                  className="w-1/2 border rounded p-2"
                  value={formData.preference}
                  onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
                >
                  <option value="">Looking For</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="bi">Bi</option>
                </select>
              </div>
              <input
                required
                type="file"
                accept="image/*"
                className="w-full p-2"
                onChange={handleFileUpload}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                />
                <label className="text-sm text-gray-700">
                  I accept the CreditCupid Ethics Agreement: Respect, kindness and zero harassment.
                </label>
              </div>
              <Button type="submit" className="w-full bg-pink-500 text-white hover:bg-pink-600">
                Create Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="border-pink-300 bg-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" /> Your CreditCupid Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 items-center">
            {profile.photo && (
              <img
                src={profile.photo}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-pink-300"
              />
            )}
            <div>
              <p className="text-lg font-semibold">{profile.name}, {profile.age}</p>
              <p className="text-sm text-gray-700">{profile.about}</p>
              <p className="text-sm mt-2">Favorite protocol: {profile.favoriteApp}</p>
              <p className="mt-2 text-xs text-pink-700 italic">
                Verified by CreditCupid — only credit score, never sensitive details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" /> Discover Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {mockMatches[index] ? (
            <div>
              <img
                src={mockMatches[index].photo}
                alt={mockMatches[index].name}
                className="w-64 h-64 rounded-2xl object-cover mx-auto border-4 border-pink-200 shadow-md"
              />
              <h3 className="mt-4 text-xl font-semibold">{mockMatches[index].name}, {mockMatches[index].age}</h3>
              <p className="text-sm text-gray-700">{mockMatches[index].about}</p>
              <div className="flex justify-center gap-6 mt-6">
                <button onClick={() => handleSwipe(false)} className="text-gray-400 hover:text-gray-600 text-3xl">💔</button>
                <button onClick={() => handleSwipe(true)} className="text-pink-500 hover:text-pink-600 text-3xl">💖</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No more matches yet!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

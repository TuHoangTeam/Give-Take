import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface WalletTransaction {
  id: number;
  action: string;
  amount: number;
  date: string;
  description: string;
}

interface EcoImpact {
  totalCO2Saved: number;
  trashReduced: number;
  equivalentTrees: number;
}

interface Wishlist {
  id: number;
  keyword: string;
  categoryId: string;
  categoryName: string;
  maxDistance: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
}

interface AppContextType {
  gPoints: number;
  walletHistory: WalletTransaction[];
  ecoImpact: EcoImpact;
  wishlists: Wishlist[];
  userProfile: UserProfile;
  darkMode: boolean;
  addGPoints: (amount: number, description: string) => void;
  deductGPoints: (amount: number, description: string) => void;
  addEcoImpact: (co2: number, trash: number) => void;
  addWishlist: (wishlist: Omit<Wishlist, "id" | "status" | "createdAt">) => void;
  removeWishlist: (id: number) => void;
  checkSufficientPoints: (required: number) => boolean;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  toggleDarkMode: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [gPoints, setGPoints] = useState(15);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([
    {
      id: 1,
      action: "INITIAL_BONUS",
      amount: 15,
      date: new Date().toISOString(),
      description: "Điểm khởi đầu - Chào mừng bạn!",
    },
  ]);
  const [ecoImpact, setEcoImpact] = useState<EcoImpact>({
    totalCO2Saved: 0,
    trashReduced: 0,
    equivalentTrees: 0,
  });
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Thành Anh",
    email: "thanh.anh@email.com",
    phone: "+84 xxx xxx xxx",
    location: "TP. Hồ Chí Minh",
    bio: "Yêu thích chia sẻ và tái sử dụng đồ cũ 🌱",
    avatar: "TA",
  });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem("darkMode");
      if (saved === "true") {
        setDarkMode(true);
      }
    };
    loadTheme();
  }, []);

  const addGPoints = (amount: number, description: string) => {
    setGPoints((prev) => prev + amount);
    setWalletHistory((prev) => [
      {
        id: prev.length + 1,
        action: "ADD_POINTS",
        amount,
        date: new Date().toISOString(),
        description,
      },
      ...prev,
    ]);
  };

  const deductGPoints = (amount: number, description: string) => {
    setGPoints((prev) => prev - amount);
    setWalletHistory((prev) => [
      {
        id: prev.length + 1,
        action: "DEDUCT_POINTS",
        amount: -amount,
        date: new Date().toISOString(),
        description,
      },
      ...prev,
    ]);
  };

  const addEcoImpact = (co2: number, trash: number) => {
    setEcoImpact((prev) => ({
      totalCO2Saved: prev.totalCO2Saved + co2,
      trashReduced: prev.trashReduced + trash,
      equivalentTrees: Math.floor((prev.totalCO2Saved + co2) / 7.5),
    }));
  };

  const addWishlist = (wishlist: Omit<Wishlist, "id" | "status" | "createdAt">) => {
    setWishlists((prev) => [
      {
        ...wishlist,
        id: prev.length + 1,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const removeWishlist = (id: number) => {
    setWishlists((prev) => prev.filter((w) => w.id !== id));
  };

  const checkSufficientPoints = (required: number) => gPoints >= required;

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
  };

  const toggleDarkMode = async () => {
    setDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem("darkMode", String(next));
      return next;
    });
  };

  const logout = () => {
    setGPoints(15);
    setWalletHistory([
      {
        id: 1,
        action: "INITIAL_BONUS",
        amount: 15,
        date: new Date().toISOString(),
        description: "Điểm khởi đầu - Chào mừng bạn!",
      },
    ]);
    setEcoImpact({ totalCO2Saved: 0, trashReduced: 0, equivalentTrees: 0 });
    setWishlists([]);
  };

  return (
    <AppContext.Provider
      value={{
        gPoints,
        walletHistory,
        ecoImpact,
        wishlists,
        userProfile,
        darkMode,
        addGPoints,
        deductGPoints,
        addEcoImpact,
        addWishlist,
        removeWishlist,
        checkSufficientPoints,
        updateUserProfile,
        toggleDarkMode,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

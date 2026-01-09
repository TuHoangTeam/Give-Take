import { CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface SuccessAnimationProps {
  isVisible: boolean;
  onClose: () => void;
  type?: "give" | "take";
  co2Saved?: number;
  pointsEarned?: number;
}

export function SuccessAnimation({ isVisible, onClose, type = "give", co2Saved = 0, pointsEarned = 0 }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-sm rounded-3xl bg-white px-8 py-10 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#7DD3CE] to-[#FFB6C1] text-white">
              <CheckCircle className="h-9 w-9" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Đăng tin thành công!</h3>
            <p className="text-sm text-gray-600 mb-4">
              {type === "give" ? "Cảm ơn bạn đã chia sẻ món đồ của mình." : "Yêu cầu của bạn đã được ghi nhận."}
            </p>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Điểm nhận</p>
                <p className="text-lg font-semibold text-[#7DD3CE]">+{pointsEarned} GP</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">CO₂ ước tính</p>
                <p className="text-lg font-semibold text-[#FF8CA3]">{co2Saved.toFixed(1)} kg</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-full bg-gradient-to-r from-[#7DD3CE] to-[#FFB6C1] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl"
            >
              Đóng
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

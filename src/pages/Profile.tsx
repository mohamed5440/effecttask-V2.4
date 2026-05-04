import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useStore } from "../store";
import { Target } from "lucide-react";
import { motion } from "motion/react";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileTasks } from "../components/profile/ProfileTasks";
import { ProfileReviews } from "../components/profile/ProfileReviews";
import { EditProfileModal } from "../components/profile/EditProfileModal";

export default function Profile() {
  const { userId } = useParams();
  const {
    users,
    tasks,
    reviews,
    applications,
    currentUser,
    updateUser,
    uploadAvatar,
    fetchUser,
    error: storeError,
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const targetUserId = userId || currentUser?.id;
  const user =
    users.find((u) => u.id === targetUserId) ||
    (targetUserId === currentUser?.id ? currentUser : null);

  React.useEffect(() => {
    if (!user && targetUserId && !isFetching) {
      setIsFetching(true);
      fetchUser(targetUserId).finally(() => setIsFetching(false));
    }
  }, [targetUserId, user, fetchUser, isFetching]);

  if (!user || isFetching) {
    if (!currentUser && !userId) return <Navigate to="/login" />;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400 gap-4">
        <Target className="w-12 h-12" />
        <p className="font-bold text-sm tracking-tight uppercase">
          لحظات من فضلك... جاري تحضير البيانات
        </p>
      </div>
    );
  }

  const userTasks = tasks.filter(
    (t) => t.assignedToUser === user.id || t.authorId === user.id,
  );
  const userApplications = applications.filter((app) => app.userId === user.id);
  const userReviews = reviews
    .filter((r) => r.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-12 mb-20 md:mb-0 text-start">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 md:space-y-12 lg:space-y-16"
      >
        <ProfileHeader
          user={user}
          isOwnProfile={isOwnProfile}
          onEdit={() => setIsEditing(true)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          <div className="md:col-span-2 space-y-6 md:space-y-10 overflow-hidden min-w-0">
            <ProfileTasks
              tasks={userTasks}
              applications={userApplications}
              isOwnProfile={isOwnProfile}
            />
          </div>

          <div className="md:col-span-1 space-y-8 min-w-0">
            <ProfileReviews reviews={userReviews} />
          </div>
        </div>
      </motion.div>

      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          user={user}
          onSave={(data) => updateUser(user.id, data)}
          onUploadAvatar={(file) => uploadAvatar(user.id, file)}
          error={storeError}
        />
      )}
    </div>
  );
}

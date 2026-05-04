import { create } from "zustand";
import { AppState } from "./types";
import { createAuthSlice } from "./authSlice";
import { createTaskSlice } from "./taskSlice";
import { createChatSlice } from "./chatSlice";
import { createRealtimeSlice } from "./realtimeSlice";

export const useStore = create<AppState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createTaskSlice(...a),
  ...createChatSlice(...a),
  ...createRealtimeSlice(...a),
}));

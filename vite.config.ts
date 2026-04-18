import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Lesson-Plan-App/",
  plugins: [react()],
});

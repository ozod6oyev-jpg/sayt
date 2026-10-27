"use client";

import { useEffect } from "react";
import { ensurePush, pushState } from "@/lib/push-browser";

/**
 * Har qanday admin sahifasi ochilganda brauzerdagi push obunasi serverda
 * ro'yxatdan o'tganini tekshiradi. Yo'q bo'lsa (baza tozalangan, endpoint
 * yangilangan va h.k.) avtomatik qayta ro'yxatdan o'tkazadi.
 */
export function AdminPushSync() {
  useEffect(() => {
    void (async () => {
      try {
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

        const state = await pushState("admin");
        if (state === "on") return;

        // Ruxsat berilgan bo'lsa mavjud obunani serverga yozamiz (obunani bekor qilmaymiz)
        await ensurePush("admin");
      } catch {
        // keyingi ochilishda qayta urinadi
      }
    })();
  }, []);

  return null;
}

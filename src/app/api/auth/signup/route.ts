import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail, sendAdminNewAccountAlert } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            displayName: displayName || null,
          },
        },
        privacySettings: {
          create: {},
        },
      },
    });

    // Auto-follow default rooms
    const defaultRooms = await prisma.room.findMany({
      where: { isDefault: true },
    });

    if (defaultRooms.length > 0) {
      await prisma.roomFollow.createMany({
        data: defaultRooms.map((room) => ({
          userId: user.id,
          roomId: room.id,
        })),
      });
    }

    // Create verification token (expires in 24h)
    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail({ to: email, token });

    try {
      await sendAdminNewAccountAlert({ email, displayName, userId: user.id });
    } catch (emailErr) {
      console.error("Failed to send admin new account alert:", emailErr);
    }

    return NextResponse.json({ success: true, userId: user.id, requiresVerification: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

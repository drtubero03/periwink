import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const client = new Anthropic();

const SYSTEM = `You are the Periwink Admin Expert — an AI assistant embedded in the Periwink admin console.

Periwink is a privacy-first community platform for women navigating perimenopause and menopause. It combines community discussion, symptom tracking, and citizen science. The founder is Dr. Adrian Tubero, a clinical psychologist.

Your job is to help Adrian manage the community day-to-day. Always use plain, warm language — she is not a developer.

**What you can do:**
- View and summarize community stats, signups, applications, users, posts, activity, and moderation flags
- Approve, decline, or update the status of founding member applications
- Hide, show, pin, lock, or soft-delete community posts
- Resolve AI moderation flags (mark reviewed or dismiss)
- Create new community rooms
- Answer questions about how the platform works, the design, brand voice, and feature set

**What you cannot do:**
- Delete user accounts
- Change passwords, secrets, or environment variables
- Deploy code or trigger builds
- Modify the database schema
- Make any changes to infrastructure

**Platform reference:**
- Live app: https://periwink-rjmcuborrq-ue.a.run.app
- Landing page: https://www.yourperiwink.com
- Admin console: https://periwink-rjmcuborrq-ue.a.run.app/admin
- Colors: dusty plum #6E5A7E, lavender #B7A8C9, periwinkle #8C92FF, warm ivory #F7F3EE, ink #2B2433
- Fonts: Cormorant Garamond (headings, weight 300–400), DM Sans (body, weight 300)
- Brand voice: warm, empathetic, validating, second-person, privacy-focused, no medical claims

When you take an action, confirm it clearly and concisely. When reporting data, be specific — give counts, names, dates. Format lists with bullet points when helpful.`;

const tools: Anthropic.Tool[] = [
  {
    name: "get_stats",
    description: "Get community metrics: total users, signups, applications, posts, comments, reactions, rooms, symptom logs, and pending flags.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_signups",
    description: "Get waitlist signups, optionally filtered by a search term.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: { type: "string", description: "Filter by name, email, or pseudonym" },
        limit: { type: "number", description: "Max results (default 30)" },
      },
      required: [],
    },
  },
  {
    name: "get_applications",
    description: "Get founding member applications, optionally filtered by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["ALL", "PENDING", "REVIEWING", "APPROVED", "DECLINED"], description: "Filter by status (default ALL)" },
        limit: { type: "number", description: "Max results (default 50)" },
      },
      required: [],
    },
  },
  {
    name: "get_users",
    description: "Get registered users, optionally filtered by search term.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: { type: "string", description: "Filter by email or display name" },
        limit: { type: "number", description: "Max results (default 30)" },
      },
      required: [],
    },
  },
  {
    name: "get_posts",
    description: "Get community posts, optionally filtered by search term.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: { type: "string", description: "Filter by title, body, author name, or room" },
        limit: { type: "number", description: "Max results (default 30)" },
      },
      required: [],
    },
  },
  {
    name: "get_activity",
    description: "Get recent community activity: latest posts and comments across all rooms.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max items (default 40)" },
      },
      required: [],
    },
  },
  {
    name: "get_flags",
    description: "Get AI moderation flags, optionally filtered by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["ALL", "PENDING", "REVIEWED", "DISMISSED"], description: "Filter by status (default PENDING)" },
      },
      required: [],
    },
  },
  {
    name: "get_rooms",
    description: "Get all community rooms with post and follower counts.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "update_application_status",
    description: "Change the status of a founding member application.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Application ID" },
        status: { type: "string", enum: ["PENDING", "REVIEWING", "APPROVED", "DECLINED"] },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "toggle_post",
    description: "Hide, show, pin, unpin, lock, or unlock a community post.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Post ID" },
        isHidden: { type: "boolean", description: "Hide (true) or show (false) the post" },
        isPinned: { type: "boolean", description: "Pin (true) or unpin (false) the post" },
        isLocked: { type: "boolean", description: "Lock (true) or unlock (false) comments on the post" },
      },
      required: ["id"],
    },
  },
  {
    name: "resolve_flag",
    description: "Mark an AI moderation flag as reviewed or dismiss it.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Flag ID" },
        status: { type: "string", enum: ["REVIEWED", "DISMISSED"] },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "create_room",
    description: "Create a new community discussion room.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Room display name" },
        slug: { type: "string", description: "URL slug (lowercase, hyphens, no spaces)" },
        description: { type: "string", description: "One sentence description" },
        icon: { type: "string", description: "Emoji icon" },
        isDefault: { type: "boolean", description: "Show to all new members by default" },
        sortOrder: { type: "number", description: "Display order (lower = earlier)" },
      },
      required: ["name", "slug", "description"],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_stats": {
      const [
        totalUsers, totalSignups, totalApplications, pendingApplications,
        totalPosts, totalComments, totalReactions, totalRooms, totalSymptomLogs,
        pendingFlags,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.communitySignup.count(),
        prisma.foundingMemberApplication.count(),
        prisma.foundingMemberApplication.count({ where: { status: "PENDING" } }),
        prisma.post.count({ where: { deletedAt: null } }),
        prisma.comment.count({ where: { deletedAt: null } }),
        prisma.reaction.count(),
        prisma.room.count({ where: { isArchived: false } }),
        prisma.symptomLog.count(),
        prisma.moderationFlag.count({ where: { status: "PENDING" } }),
      ]);
      return { totalUsers, totalSignups, totalApplications, pendingApplications, totalPosts, totalComments, totalReactions, totalRooms, totalSymptomLogs, pendingFlags };
    }

    case "get_signups": {
      const { search, limit = 30 } = input as { search?: string; limit?: number };
      return prisma.communitySignup.findMany({
        where: search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { pseudonym: { contains: search, mode: "insensitive" } },
          ],
        } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, name: true, email: true, pseudonym: true, createdAt: true },
      });
    }

    case "get_applications": {
      const { status = "ALL", limit = 50 } = input as { status?: string; limit?: number };
      return prisma.foundingMemberApplication.findMany({
        where: status !== "ALL" ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, name: true, email: true, roleType: true, status: true, whatDrawsYou: true, whatYouOffer: true, organization: true, website: true, createdAt: true },
      });
    }

    case "get_users": {
      const { search, limit = 30 } = input as { search?: string; limit?: number };
      return prisma.user.findMany({
        where: search ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { profile: { displayName: { contains: search, mode: "insensitive" } } },
          ],
        } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, email: true, createdAt: true, profile: { select: { displayName: true, menopauseStage: true } } },
      });
    }

    case "get_posts": {
      const { search, limit = 30 } = input as { search?: string; limit?: number };
      const posts = await prisma.post.findMany({
        where: {
          deletedAt: null,
          ...(search ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { body: { contains: search, mode: "insensitive" } },
              { room: { name: { contains: search, mode: "insensitive" } } },
              { author: { profile: { displayName: { contains: search, mode: "insensitive" } } } },
            ],
          } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true, title: true, body: true, identity: true, isPinned: true, isLocked: true, isHidden: true, viewCount: true, createdAt: true,
          author: { select: { email: true, profile: { select: { displayName: true } } } },
          room: { select: { name: true, slug: true } },
          _count: { select: { comments: true, reactions: true } },
        },
      });
      return posts.map(p => ({ ...p, body: p.body.slice(0, 200) + (p.body.length > 200 ? "…" : "") }));
    }

    case "get_activity": {
      const { limit = 40 } = input as { limit?: number };
      const [posts, comments] = await Promise.all([
        prisma.post.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true, title: true, body: true, identity: true, createdAt: true, isHidden: true,
            room: { select: { name: true, icon: true } },
            author: { select: { email: true, isBot: true, profile: { select: { displayName: true } } } },
            _count: { select: { comments: true, reactions: true } },
          },
        }),
        prisma.comment.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true, body: true, identity: true, createdAt: true, isHidden: true,
            post: { select: { id: true, title: true, room: { select: { name: true, icon: true } } } },
            author: { select: { email: true, isBot: true, profile: { select: { displayName: true } } } },
          },
        }),
      ]);
      return [
        ...posts.map(p => ({ type: "post", id: p.id, title: p.title, body: p.body.slice(0, 150), identity: p.identity, isHidden: p.isHidden, room: p.room, author: p.identity === "ANONYMOUS" ? "Anonymous" : (p.author.profile?.displayName || p.author.email), isBot: p.author.isBot, createdAt: p.createdAt, comments: p._count.comments, reactions: p._count.reactions })),
        ...comments.map(c => ({ type: "comment", id: c.id, body: c.body.slice(0, 150), identity: c.identity, isHidden: c.isHidden, room: c.post?.room, postTitle: c.post?.title, author: c.identity === "ANONYMOUS" ? "Anonymous" : (c.author.profile?.displayName || c.author.email), isBot: c.author.isBot, createdAt: c.createdAt })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
    }

    case "get_flags": {
      const { status = "PENDING" } = input as { status?: string };
      return prisma.moderationFlag.findMany({
        where: status !== "ALL" ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, reason: true, severity: true, status: true, createdAt: true,
          post: { select: { id: true, title: true, body: true, room: { select: { name: true } } } },
          comment: { select: { id: true, body: true, post: { select: { title: true, room: { select: { name: true } } } } } },
        },
      });
    }

    case "get_rooms": {
      return prisma.room.findMany({
        where: { isArchived: false },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true, icon: true, description: true, isDefault: true, sortOrder: true, _count: { select: { posts: true, followers: true } } },
      });
    }

    case "update_application_status": {
      const { id, status } = input as { id: string; status: string };
      const app = await prisma.foundingMemberApplication.update({
        where: { id },
        data: { status },
        select: { name: true, email: true, status: true },
      });
      return { success: true, application: app };
    }

    case "toggle_post": {
      const { id, isHidden, isPinned, isLocked } = input as { id: string; isHidden?: boolean; isPinned?: boolean; isLocked?: boolean };
      const data: Record<string, boolean> = {};
      if (typeof isHidden === "boolean") data.isHidden = isHidden;
      if (typeof isPinned === "boolean") data.isPinned = isPinned;
      if (typeof isLocked === "boolean") data.isLocked = isLocked;
      const post = await prisma.post.update({ where: { id }, data, select: { id: true, title: true, isHidden: true, isPinned: true, isLocked: true } });
      return { success: true, post };
    }

    case "resolve_flag": {
      const { id, status } = input as { id: string; status: "REVIEWED" | "DISMISSED" };
      await prisma.moderationFlag.update({ where: { id }, data: { status, reviewedAt: new Date() } });
      return { success: true, id, status };
    }

    case "create_room": {
      const { name, slug, description, icon, isDefault = false, sortOrder = 0 } = input as { name: string; slug: string; description: string; icon?: string; isDefault?: boolean; sortOrder?: number };
      const room = await prisma.room.create({
        data: { name, slug, description, icon, isDefault, sortOrder },
        select: { id: true, name: true, slug: true },
      });
      return { success: true, room };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function POST(request: NextRequest) {
  const denied = verifyAdmin(request);
  if (denied) return denied;

  try {
    const { messages } = await request.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Convert simple messages to Anthropic format (filter out empty content)
    let apiMessages: Anthropic.MessageParam[] = messages
      .filter(m => m.content?.trim())
      .map(m => ({ role: m.role, content: m.content }));

    // Agentic loop — run up to 5 tool call rounds
    const MAX_ROUNDS = 5;
    let finalText = "";

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM,
        tools,
        messages: apiMessages,
      });

      // Collect any text from this response
      const textBlocks = response.content.filter(b => b.type === "text");
      if (textBlocks.length > 0) {
        finalText = textBlocks.map(b => (b as Anthropic.TextBlock).text).join("\n");
      }

      // If no tool calls, we're done
      const toolUseBlocks = response.content.filter(b => b.type === "tool_use") as Anthropic.ToolUseBlock[];
      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        break;
      }

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await executeTool(block.name, block.input as Record<string, unknown>);
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Append assistant message (with tool_use blocks) and tool results
      apiMessages = [
        ...apiMessages,
        { role: "assistant" as const, content: response.content },
        { role: "user" as const, content: toolResults },
      ];
    }

    return NextResponse.json({ message: finalText || "I couldn't generate a response. Please try again." });
  } catch (error) {
    console.error("Admin chat error:", error);
    return NextResponse.json({ error: "Chat error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRoomBySlug, getPostsForRoom, getCommentsForPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import { LockedButton } from "@/components/GrowingMessage";

const PREVIEW_COUNT = 2; // posts shown before the gate

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const session = await auth();
  const isGuest = !session;

  const posts = await getPostsForRoom(room.id);
  const visiblePosts = isGuest ? posts.slice(0, PREVIEW_COUNT + 1) : posts;

  const postIds = visiblePosts.map((p) => p.id);
  const allComments = !isGuest && postIds.length > 0 ? await getCommentsForPosts(postIds) : [];

  const commentsByPost = new Map<string, typeof allComments>();
  for (const c of allComments) {
    const list = commentsByPost.get(c.postId) || [];
    list.push(c);
    commentsByPost.set(c.postId, list);
  }

  return (
    <>
      {/* Room header */}
      <section style={{ marginBottom: 28 }}>
        <Link
          href="/app/rooms"
          style={{
            fontSize: 13, color: "var(--color-text-3)", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16,
          }}
        >
          ← All conversations
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <span style={{ fontSize: 36 }}>{room.icon}</span>
          <div>
            <h1 style={{
              fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 400,
              color: "var(--color-ink)", lineHeight: 1.2,
            }}>
              {room.name}
            </h1>
            <p style={{ fontSize: 13, color: "var(--color-text-3)" }}>
              {room._count.followers} members · {room._count.posts} posts
            </p>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.7, marginBottom: 16 }}>
          {room.description}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <LockedButton
            action="share a post"
            style={{
              background: "var(--color-dusty-plum)", color: "#fff",
              border: "none", borderRadius: 999, padding: "10px 22px",
              fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 400,
            }}
          >
            New post
          </LockedButton>
          <LockedButton
            action="follow this conversation"
            style={{
              background: "none", color: "var(--color-dusty-plum)",
              border: "1px solid var(--color-lavender)", borderRadius: 999,
              padding: "10px 22px", fontSize: 14, cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 400,
            }}
          >
            Join to Follow
          </LockedButton>
        </div>
      </section>

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          color: "var(--color-text-3)", fontSize: 15,
        }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, marginBottom: 8 }}>
            This conversation is just beginning.
          </p>
          <p>Join Periwink to be among the first to share here.</p>
        </div>
      ) : isGuest ? (
        <>
          {/* Preview: first PREVIEW_COUNT posts shown normally */}
          {visiblePosts.slice(0, PREVIEW_COUNT).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Third post: partially faded */}
          {visiblePosts.length > PREVIEW_COUNT && (
            <div style={{ position: "relative", overflow: "hidden", maxHeight: 180, borderRadius: 16 }}>
              <PostCard post={visiblePosts[PREVIEW_COUNT]} />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "100%",
                background: "linear-gradient(to bottom, transparent 0%, rgba(250,250,248,0.7) 45%, rgba(250,250,248,0.97) 100%)",
                pointerEvents: "none",
              }} />
            </div>
          )}

          {/* Join gate */}
          <div style={{
            textAlign: "center",
            padding: "40px 28px 44px",
            background: "linear-gradient(135deg, var(--color-soft-mist, #E8E3EA) 0%, var(--color-warm-ivory, #F7F3EE) 100%)",
            borderRadius: 20,
            border: "1px solid var(--color-border-warm, #DDD7CE)",
            marginTop: 8,
          }}>
            <p style={{
              fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)",
              fontSize: 22, fontWeight: 300,
              color: "var(--color-ink, #2B2433)",
              marginBottom: 10, lineHeight: 1.4,
            }}>
              Join Periwink to continue reading.
            </p>
            <p style={{
              fontSize: 14, color: "var(--color-text-2, #6B6575)",
              lineHeight: 1.75, marginBottom: 28, maxWidth: 380, margin: "0 auto 28px",
            }}>
              Read, reflect, and connect with women navigating similar experiences. The community is always free and open.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/auth/signup"
                style={{
                  background: "var(--color-dusty-plum, #6E5A7E)", color: "#fff",
                  textDecoration: "none", borderRadius: 999,
                  padding: "12px 28px", fontSize: 14,
                  fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                }}
              >
                Join Periwink — it&apos;s free
              </Link>
              <Link
                href="/auth/signin"
                style={{
                  background: "none", color: "var(--color-dusty-plum, #6E5A7E)",
                  textDecoration: "none", borderRadius: 999,
                  padding: "12px 28px", fontSize: 14,
                  border: "1px solid var(--color-lavender, #B7A8C9)",
                  fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            expanded
            comments={commentsByPost.get(post.id)}
          />
        ))
      )}
    </>
  );
}

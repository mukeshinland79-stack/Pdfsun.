import React, { useState } from "react";
import { BLOG_POSTS } from "../data/blogData";
import { BlogPost } from "../types";
import { BookOpen, X, Clock, Calendar, User, Search, ArrowLeft } from "lucide-react";

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlogModal: React.FC<BlogModalProps> = ({ isOpen, onClose }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredPosts = BLOG_POSTS.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedPost ? (
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white transition flex items-center space-x-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Articles</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-orange-500" />
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">PDFSun Blog & Guides</h2>
                  <p className="text-[10px] text-slate-400">PDFSUN.COM Master Knowledge Base</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {selectedPost ? (
            /* Single Article View */
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-amber-400 border border-orange-500/20">
                  {selectedPost.category}
                </span>

                <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {selectedPost.title}
                </h1>

                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                    <span>{selectedPost.author}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedPost.date}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedPost.readTime}</span>
                  </span>
                </div>
              </div>

              <img
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-64 rounded-2xl object-cover shadow-md"
              />

              <div className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {selectedPost.content}
              </div>
            </div>
          ) : (
            /* Articles Grid View */
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search articles, tutorials, privacy guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-orange-500 transition cursor-pointer overflow-hidden group flex flex-col justify-between"
                  >
                    <div>
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-orange-500 uppercase">{post.category}</span>
                          <span className="text-slate-400">{post.readTime}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-orange-500 transition">
                          {post.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 mt-2">
                      <span>By {post.author}</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

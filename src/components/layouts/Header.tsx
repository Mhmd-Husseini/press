'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export const Header = () => {
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const categories = [
    { name: 'Politics', href: '/categories/politics' },
    { name: 'Business', href: '/categories/business' },
    { name: 'Technology', href: '/categories/technology' },
    { name: 'Health', href: '/categories/health' },
    { name: 'Science', href: '/categories/science' },
    { name: 'Sports', href: '/categories/sports' },
    { name: 'Entertainment', href: '/categories/entertainment' },
    { name: 'World', href: '/categories/world' },
  ];

  return (
    <header className="bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="bg-amber-700 py-1">
        <div className="container mx-auto px-4 flex justify-between">
          <div className="text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex space-x-4 text-sm">
            <Link href="/login" className="hover:underline">Sign In</Link>
            <button className="hover:underline">العربية</button>
          </div>
        </div>
      </div>
      
      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-10 md:h-12 md:w-12">
              <Image 
                src="/phoenix-logo.svg" 
                alt="Phoenix Press" 
                width={48} 
                height={48}
                className="object-contain"
              />
            </div>
            <div className="ml-2 flex flex-col">
              <span className="text-xl md:text-2xl font-bold tracking-tight">Phoenix</span>
              <span className="text-sm md:text-lg font-semibold -mt-1 text-amber-400">فينيقيا</span>
            </div>
          </Link>
          
          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={toggleMobileMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Search & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 w-40"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Link href="/subscribe" className="bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-sm font-semibold transition-colors">
              Subscribe
            </Link>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="bg-gray-800">
        <div className="container mx-auto px-4">
          <ul className="hidden md:flex space-x-1 overflow-x-auto py-2 text-sm font-medium">
            <li>
              <Link 
                href="/"
                className={`px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                  pathname === '/' ? 'bg-gray-700 font-semibold' : ''
                }`}
              >
                Home
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.name}>
                <Link 
                  href={category.href}
                  className={`px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                    pathname === category.href ? 'bg-gray-700 font-semibold' : ''
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link 
                href="/trending"
                className={`px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                  pathname === '/trending' ? 'bg-gray-700 font-semibold' : ''
                }`}
              >
                Trending
              </Link>
            </li>
            <li>
              <Link 
                href="/videos"
                className={`px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                  pathname === '/videos' ? 'bg-gray-700 font-semibold' : ''
                }`}
              >
                Videos
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-gray-800 overflow-hidden transition-all">
          <div className="container mx-auto px-4 py-2">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search"
                className="bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
              />
            </div>
            <ul className="space-y-2 pb-3">
              <li>
                <Link 
                  href="/"
                  className={`block px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                    pathname === '/' ? 'bg-gray-700 font-semibold' : ''
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Home
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.name}>
                  <Link 
                    href={category.href}
                    className={`block px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                      pathname === category.href ? 'bg-gray-700 font-semibold' : ''
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  href="/trending"
                  className={`block px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                    pathname === '/trending' ? 'bg-gray-700 font-semibold' : ''
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link 
                  href="/videos"
                  className={`block px-3 py-2 rounded hover:bg-gray-700 transition-colors ${
                    pathname === '/videos' ? 'bg-gray-700 font-semibold' : ''
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Videos
                </Link>
              </li>
              <li className="pt-2 border-t border-gray-700">
                <Link 
                  href="/subscribe"
                  className="block px-3 py-2 bg-amber-600 hover:bg-amber-700 text-center rounded font-semibold transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Subscribe
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Breaking News Ticker */}
      <div className="bg-red-700 text-white py-2 px-4 overflow-hidden">
        <div className="container mx-auto flex items-center">
          <span className="font-bold mr-3 whitespace-nowrap">BREAKING NEWS:</span>
          <div className="overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-[marquee_30s_linear_infinite]">
              Latest updates on major international developments • Economic indicators show promising growth • New technology breakthrough announced
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
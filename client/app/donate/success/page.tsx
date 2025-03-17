"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@nextui-org/button";
import { Card } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Divider } from "@nextui-org/divider";
import { Progress } from "@heroui/progress";
import { Share2, Heart, Twitter, Facebook, Copy, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '5000';
  const projectName = searchParams.get('project') || 'նախագծին';
  const projectSlug = searchParams.get('slug') || '';
  
  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(Math.floor(Math.random() * 50) + 20);
  const { width, height } = useWindowSize();
  
  // Remove the timeout that stops the confetti
  useEffect(() => {
    // Initial confetti burst
    setShowConfetti(true);
    
    // Let confetti run its natural course without a timeout
    // The confetti will stop when all pieces fall off screen
  }, []);
  
  // Simulate share count increasing
  useEffect(() => {
    const interval = setInterval(() => {
      setShareCount(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Ես նվիրաբերեցի ${amount} ֏ ${projectName}! Միացեք ինձ և աջակցեք այս կարևոր նախաձեռնությանը:`;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-b from-primary-50 to-white">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}  // Change to false so it doesn't keep generating new pieces
          numberOfPieces={200}
          gravity={0.2}    // Adjust gravity for a nice fall speed
          initialVelocityY={-10} // Initial upward velocity for a burst effect
          tweenDuration={8000}   // Duration of the animation
        />
      )}
      
      <div className="max-w-2xl w-full mx-auto text-center mb-8">
        <div className="inline-block bg-primary-100 p-4 rounded-full mb-4">
          <Heart className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary-800">Շնորհակալություն Ձեր նվիրատվության համար!</h1>
        <p className="text-xl text-default-700 mb-6">
          Դուք նվիրաբերել եք <span className="font-bold text-primary">{parseInt(amount).toLocaleString()} ֏</span> {projectName}
        </p>
        
        <Card className="p-6 shadow-lg mb-8 bg-white border-none">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Image
                src="/donation-success.png"
                alt="Success"
                className="object-cover"
                fallbackSrc="https://via.placeholder.com/150/4338ca/ffffff?text=✓"
                width={80}
                height={80}
              />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Ձեր ազդեցությունը</h2>
            <p className="text-default-600 mb-4 text-center">
              Ձեր նվիրատվությունը օգնում է մեզ հասնել մեր նպատակին և ստեղծել դրական փոփոխություն:
            </p>
            
            <div className="w-full mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Հավաքված</span>
                <span>Նպատակ</span>
              </div>
              <Progress 
                value={65} 
                color="primary"
                className="h-3 mb-1"
                aria-label="Funding progress"
              />
              <div className="flex justify-between text-sm">
                <span className="font-medium text-primary">2,450,000 ֏</span>
                <span>3,500,000 ֏</span>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 w-full mb-6">
              <p className="text-amber-800 font-medium text-center">
                Ձեր նվիրատվության հաստատումը ուղարկվել է Ձեր էլ. փոստին
              </p>
            </div>
            
            <Divider className="my-4 w-full" />
            
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-3 text-center">Կիսվեք Ձեր ազդեցությամբ</h3>
              <p className="text-sm text-default-500 mb-4 text-center">
                {shareCount} մարդ արդեն կիսվել է
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Button 
                  as="a"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1DA1F2] text-white"
                  startContent={<Twitter size={18} />}
                >
                  Twitter
                </Button>
                <Button 
                  as="a"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#4267B2] text-white"
                  startContent={<Facebook size={18} />}
                >
                  Facebook
                </Button>
                <Button 
                  onClick={handleCopyLink}
                  className="bg-default-100"
                  startContent={copied ? <Check size={18} /> : <Copy size={18} />}
                >
                  {copied ? "Պատճենված է" : "Պատճենել հղումը"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            as={Link}
            href={projectSlug ? `/project/${projectSlug}` : "/"}
            color="primary"
            variant="flat"
            className="px-6"
            endContent={<ArrowRight size={18} />}
          >
            Վերադառնալ նախագիծ
          </Button>
          <Button 
            as={Link}
            href="/"
            color="default"
            variant="flat"
            className="px-6"
          >
            Գլխավոր էջ
          </Button>
        </div>
      </div>
    </div>
  );
} 
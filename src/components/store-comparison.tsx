"use client";

import {
    BadgeCheck,
    Check,
    Headset,
    Info,
    PackageCheck,
    RefreshCcw,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

const comparisonRows = [
    {
        icon: BadgeCheck,
        title: "Product authenticity",
        description: "Clear product sourcing and brand information",
        store: "Verified products",
        other: "Varies by seller",
    },
    {
        icon: Info,
        title: "Product information",
        description: "Specifications, pricing and product details",
        store: "Clear & detailed",
        other: "Varies by seller",
    },
    {
        icon: ShieldCheck,
        title: "Secure checkout",
        description: "A secure process for placing your order",
        store: "Secure checkout",
        other: "Depends on seller",
    },
    {
        icon: Truck,
        title: "Order tracking",
        description: "Stay informed after placing your order",
        store: "Order tracking",
        other: "Varies by seller",
    },
    {
        icon: Headset,
        title: "Customer support",
        description: "Help when you need assistance with your order",
        store: "Dedicated support",
        other: "Seller-dependent",
    },
    {
        icon: RefreshCcw,
        title: "Returns & exchanges",
        description: "Clear information about post-purchase options",
        store: "Clear store policy",
        other: "Varies by seller",
    },
    {
        icon: PackageCheck,
        title: "After-sales assistance",
        description: "Support beyond the initial purchase",
        store: "Store support",
        other: "Depends on seller",
    },
];

export function StoreComparison() {
    return (
        <section className="mx-auto mt-24 max-w-7xl px-4">
            <Reveal>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-px w-8 bg-[#B88A3B]/60" />
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#B88A3B]">
                            Shop with confidence
                        </p>
                        <span className="h-px w-8 bg-[#B88A3B]/60" />
                    </div>

                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-4xl">
                        Compare Before You Buy
                    </h2>

                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                        See what you can expect when you shop with Mobile Store — from
                        product information to support after your purchase.
                    </p>
                </div>
            </Reveal>

            {/* ===================== Desktop Table ===================== */}
            <Reveal delay={100}>
                <div className="mt-12 hidden overflow-hidden rounded-3xl border border-[#f0e9dc] bg-white shadow-[0_8px_40px_-8px_rgba(0,0,0,0.06)] md:block">
                    {/* Header */}
                    <div className="grid grid-cols-[1.55fr_1fr_1fr] border-b border-[#f0e9dc]">
                        <div className="bg-[#faf9f6] px-8 py-7">
                            <p className="text-sm font-extrabold text-[#1a1a1a]">What matters</p>
                            <p className="mt-1 text-xs text-muted">
                                Things worth checking before placing an order
                            </p>
                        </div>

                        {/* Mobile Store Column Header */}
                        <div className="relative bg-[#111111] px-6 py-7 text-center text-white">
                            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#B88A3B] via-[#D2A85B] to-[#B88A3B]" />
                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#B88A3B]/20 text-[#D2A85B] ring-1 ring-[#B88A3B]/40">
                                <BadgeCheck size={22} />
                            </div>
                            <p className="mt-3 text-sm font-extrabold tracking-wide">Mobile Store</p>
                            <p className="mt-1 text-xs text-white/55">Your shopping experience</p>
                        </div>

                        <div className="bg-[#faf9f6] px-6 py-7 text-center">
                            <p className="text-sm font-extrabold text-[#333]">Other sellers</p>
                            <p className="mt-1 text-xs text-muted">Marketplace / independent seller</p>
                        </div>
                    </div>

                    {/* Rows */}
                    {comparisonRows.map((row, i) => {
                        const Icon = row.icon;
                        return (
                            <div
                                key={row.title}
                                className={`grid grid-cols-[1.55fr_1fr_1fr] transition-colors duration-200 hover:bg-[#faf9f6]/70 ${i !== comparisonRows.length - 1 ? "border-b border-[#f0e9dc]" : ""
                                    }`}
                            >
                                {/* Feature name */}
                                <div className="flex items-start gap-4 px-8 py-5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#faf6f0] text-[#B88A3B]">
                                        <Icon size={18} strokeWidth={1.8} />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-[#1a1a1a]">{row.title}</p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-muted">
                                            {row.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Mobile Store value */}
                                <div className="flex items-center justify-center bg-[#111111]/[0.015] px-6 py-5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B88A3B] text-white shadow-sm">
                                            <Check size={13} strokeWidth={3} />
                                        </span>
                                        <span className="text-sm font-bold text-[#1a1a1a]">{row.store}</span>
                                    </div>
                                </div>

                                {/* Other sellers */}
                                <div className="flex items-center justify-center px-6 py-5">
                                    <span className="text-sm text-muted">{row.other}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Reveal>

            {/* ===================== Mobile Cards ===================== */}
            <div className="mt-10 space-y-4 md:hidden">
                {comparisonRows.map((row, i) => {
                    const Icon = row.icon;
                    return (
                        <Reveal key={row.title} delay={i * 50}>
                            <div className="rounded-2xl border border-[#f0e9dc] bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#faf6f0] text-[#B88A3B]">
                                        <Icon size={18} strokeWidth={1.8} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-extrabold text-[#1a1a1a]">{row.title}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted">
                                            {row.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {/* Mobile Store */}
                                    <div className="rounded-xl border border-[#e7dcc7] bg-gradient-to-b from-[#fffaf0] to-[#fff7e8] p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b6a35]">
                                            GMG Store
                                        </p>
                                        <div className="mt-2.5 flex items-center gap-2">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B88A3B] text-white">
                                                <Check size={11} strokeWidth={3} />
                                            </span>
                                            <span className="text-xs font-bold text-[#1a1a1a]">{row.store}</span>
                                        </div>
                                    </div>

                                    {/* Other sellers */}
                                    <div className="rounded-xl border border-[#f0e9dc] bg-[#faf9f6] p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                            Other sellers
                                        </p>
                                        <p className="mt-2.5 text-xs leading-relaxed text-muted">
                                            {row.other}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}
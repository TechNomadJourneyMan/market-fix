'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

interface FadeUpProps extends HTMLMotionProps<'div'> {
  delay?: number;
}

export function FadeUp({ className, delay = 0, children, ...props }: FadeUpProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      transition={{ duration: 0.45, ease: EASE_OUT, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'ul' | 'section';
}) {
  const Component = motion[Tag] as typeof motion.div;
  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-32px' }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'li' | 'article';
}) {
  const Component = motion[Tag] as typeof motion.div;
  return (
    <Component
      variants={fadeUp}
      transition={{ duration: 0.42, ease: EASE_OUT }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}

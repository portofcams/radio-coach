FROM node:20-alpine
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
ENV NODE_ENV=production
ENV PORT=8012
ENV HOSTNAME=0.0.0.0
EXPOSE 8012
CMD ["node", "server.js"]

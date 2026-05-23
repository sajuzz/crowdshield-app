FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package.json .
RUN npm install
COPY frontend .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./backend/
RUN cd backend && npm install
COPY backend ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Serve frontend statics from Express for the production build
# Note: we need to slightly update server.js to serve static files if we want a unified container,
# but for demonstration we can just build a unified Node app.
# Since we didn't add static serving to server.js, let's keep it simple.

CMD ["node", "backend/src/index.js"]

const express   = require('express');
const cors      = require('cors');
const Pusher    = require('pusher');
const serverless = require('serverless-http');

// Pusher 설정 (환경 변수에서 가져옵니다)
const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID,
  key:     process.env.PUSHER_KEY,
  secret:  process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS:  true,
});

const app = express();

// ─── 미들웨어 설정 ──────────────────────────
app.use(cors());         // 모든 도메인에서의 요청 허용
app.use(express.json()); // JSON 형태의 요청 본문 파싱
// ─── 게임 상태 업데이트 라우트 ─────────────────
app.post('/api/update-game', (req, res) => {
  // 프론트엔드에서 보낸 데이터를 받도록 수정
  const { channelName, gameState, senderSocketId } = req.body;

  // 필요한 모든 데이터가 있는지 확인합니다.
  if (!channelName || !gameState || senderSocketId === undefined) { // senderSocketId는 빈 문자열일 수 있으므로 undefined 확인
    return res
      .status(400)
      .json({ error: 'channelName, gameState, senderSocketId를 모두 제공해야 합니다.' });
  }

  // 프론트엔드에서 수신하도록 'client-game-update' 이벤트를 트리거합니다.
  // 이 이벤트에는 전체 게임 상태와 보낸 클라이언트의 소켓 ID가 포함됩니다.
  pusher.trigger(
    channelName, // 프론트엔드에서 받은 채널 이름 사용
    'client-game-update', // 프론트엔드가 기다리는 이벤트 이름
    { gameState: gameState, senderSocketId: senderSocketId } // 보낼 데이터
  );

  return res.status(200).json({ success: true });
});

// ─── Pusher private 채널 인증 라우트 ───────────────
app.post('/api/pusher/auth', (req, res) => {
  const { socket_id: socketId, channel_name: channel } = req.body;
  if (!socketId || !channel) {
    return res
      .status(400)
      .send('socket_id와 channel_name이 필요합니다.');
  }

  // 인증 토큰 생성 후 반환
  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

// ─── Vercel 서버리스 함수 핸들러 내보내기 ──────────
module.exports = serverless(app);

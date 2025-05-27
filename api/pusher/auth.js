// 1. Pusher 서버 SDK를 가져옵니다.
//    이건 당신의 백엔드 프로젝트에 'pusher' 라이브러리가 설치되어 있어야 해요.
//    (package.json에 "pusher": "^x.x.x" 이런 식으로 포함되어 있을 거예요)
const Pusher = require('pusher');

// 2. Vercel 서버리스 함수의 기본 구조입니다.
//    요청(req)과 응답(res)을 받아 처리합니다.
module.exports = async (req, res) => {
  // 3. POST 요청이 맞는지 확인합니다.
  //    Pusher는 인증 요청을 POST 방식으로 보냅니다.
  if (req.method === 'POST') {
    // 4. 환경 변수에서 Pusher 설정 정보를 가져옵니다.
    //    이 정보는 vercel.json의 "env" 섹션에 있는 값들입니다.
    //    **주의: PUSHER_SECRET은 절대 프론트엔드에 노출되면 안 됩니다!**
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true, // 보안을 위해 HTTPS를 사용하도록 설정
    });

    // 5. 프론트엔드로부터 받은 'socket_id'와 'channel_name'을 가져옵니다.
    //    이 정보들은 웹사이트에서 "나는 어떤 사용자로 어떤 채널에 들어가고 싶어!" 하고 보내는 정보예요.
    const socketId = req.body.socket_id;
    const channelName = req.body.channel_name;

    // 6. **여기에 당신의 실제 인증 로직을 넣습니다.**
    //    이 부분이 바로 "보안 담당자"가 자격을 확인하는 핵심 로직이에요.
    //    예를 들어:
    //    - 사용자가 로그인했는지 확인 (세션, 토큰 등)
    //    - 이 channelName에 사용자가 접근할 권한이 있는지 확인 (데이터베이스에서 조회 등)
    //    지금은 일단 테스트를 위해 무조건 허용하는 것처럼 보일 수 있지만, 실제 서비스에서는 중요합니다.
    let authResponse;
    try {
      // 프라이빗 채널 인증 (가장 일반적인 경우)
      authResponse = pusher.authorizeChannel(socketId, channelName);
      // 만약 'presence' 채널이라면 사용자 정보도 추가해야 합니다.
      // const userData = { user_id: 'some_user_id', user_info: { name: 'Alice' } };
      // authResponse = pusher.authenticate(socketId, channelName, userData);

      // 7. 인증이 성공하면 프론트엔드로 '허가증'을 보냅니다.
      res.send(authResponse);

    } catch (error) {
      // 8. 인증 실패 시 오류를 반환합니다.
      console.error("Pusher authentication error:", error);
      res.status(403).send("Forbidden: Authentication failed."); // 403 Forbidden: 권한 없음
    }
  } else {
    // 9. POST 요청이 아니면 허용하지 않습니다.
    res.status(405).send("Method Not Allowed"); // 405 Method Not Allowed: 잘못된 요청 방식
  }
};

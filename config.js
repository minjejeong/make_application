/* Supabase 연결 정보 — README의 '처음 설정하기' 참고.
   Project URL과 anon public 키(또는 sb_publishable_로 시작하는 Publishable key)를 넣는다.
   이 키는 공개돼도 되는 키다 — 데이터는 setup.sql의 보안 규칙이 지킨다.
   service_role 키나 sb_secret_ 키는 절대 여기 넣지 말 것.
   비어 있으면 앱이 '데모 모드'로만 열린다.

   kakaoMapKey: 카카오 개발자 사이트의 'JavaScript 키' (README의 '지도 설정' 참고).
   등록한 사이트 주소에서만 동작하는 공개용 키라 여기 넣어도 된다. REST API 키·Admin 키는 넣지 말 것.
   비어 있으면 지도 탭에 지도 대신 안내가 나온다. */
window.DURISEO_CONFIG = {
  supabaseUrl: "https://wlufnzpyhyrxpahvnnbg.supabase.co",
  supabaseAnonKey: "sb_publishable_-wMJ2rRUOhkpG-BF6NddPw_2C3yoiKG",
  kakaoMapKey: "da38ed4da5ac7ce5b765cf126f065f54",
};

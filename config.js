/* Supabase 연결 정보 — README의 '처음 설정하기' 참고.
   Project URL과 anon public 키(또는 sb_publishable_로 시작하는 Publishable key)를 넣는다.
   이 키는 공개돼도 되는 키다 — 데이터는 setup.sql의 보안 규칙이 지킨다.
   service_role 키나 sb_secret_ 키는 절대 여기 넣지 말 것.
   비어 있으면 앱이 '데모 모드'로만 열린다. */
window.DURISEO_CONFIG = {
  supabaseUrl: "https://wlufnzpyhyrxpahvnnbg.supabase.co",
  supabaseAnonKey: "sb_publishable_-wMJ2rRUOhkpG-BF6NddPw_2C3yoiKG",
};

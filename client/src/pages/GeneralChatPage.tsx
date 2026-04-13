import ChatWindow from '../components/ChatWindow';

const GENERAL_ROOM_ID = '00000000-0000-0000-0000-000000000001';

export default function GeneralChatPage() {
  // Рендерим напрямую — ChatWindow заполняет layout-content через height: 100%
  return <ChatWindow roomId={GENERAL_ROOM_ID} />;
}

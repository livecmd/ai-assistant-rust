import { Modal } from "antd";
import ReactMarkdown from "react-markdown";

interface AgreementModalProps {
  open: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

function AgreementModal({ open, title, content, onClose }: AgreementModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={640}
      className="agreement-modal"
    >
      <div className="agreement-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Modal>
  );
}

export default AgreementModal;

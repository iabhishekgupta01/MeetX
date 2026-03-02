import React from "react";
import styles from "../styles/VideoMeet.module.css";

const LiveCaptions = ({ captions }) => {
	if (!captions || captions.length === 0) return null;

	return (
		<div className={styles.captionsOverlay} role="status" aria-live="polite">
			{captions.map((caption) => (
				<div key={caption.id} className={styles.captionItem}>
					<span className={styles.captionName}>{caption.username}:</span>
					<span className={styles.captionText}>{caption.text}</span>
				</div>
			))}
		</div>
	);
};

export default LiveCaptions;

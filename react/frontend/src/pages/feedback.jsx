import React, { useState } from "react";
import "./feedback.css";
import axios from "axios";

const FeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8000/feedback-post", 
       {stars:rating,
        feedback:comment,},
        { headers: { "Content-Type": "application/json" }
      });

      if (response.status === 200) {
        alert("Thank you for your feedback!");
        setRating(0);
        setComment("");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback. Please try again later.");
    }
  };

return (
  <div className="feedback-container">
    <h2>Rate Your Consultation</h2>
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${hover >= star || rating >= star ? "filled" : ""}`}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="Tell us about your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      ></textarea>
      <button type="submit">Submit Feedback</button>
    </form>
  </div>
);

}
export default FeedbackPage;
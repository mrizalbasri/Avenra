<section id="how-it-works" aria-label="How Avenra works">
  <article>
    <span>01 / PLAN</span>
    <h2>See the connections.</h2>
    <p>
      Move courses across semesters on a visual canvas. Check prerequisites and
      your own curriculum rules.
    </p>
  </article>
  <article>
    <span>02 / EXPLORE</span>
    <h2>Make room for a change.</h2>
    <p>
      Simulate a delayed course, compare saved alternatives, and bring a clearer
      plan to your advisor.
    </p>
  </article>
  <article>
    <span>03 / PRACTICE</span>
    <h2>Give your plan time.</h2>
    <p>
      Turn course goals into tasks and focused study sessions. Keep a reflection
      of what you learned.
    </p>
  </article>
</section>

<style>
  section {
    max-width: 1280px;
    margin: auto;
    padding: 60px 40px 80px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 48px;
  }
  article {
    border-top: 1px solid #3f3f46;
    padding-top: 24px;
  }
  span {
    color: #f5f5f7;
    font-size: 11px;
    letter-spacing: 1.4px;
  }
  h2 {
    font-size: 21px;
    margin: 16px 0 12px;
    letter-spacing: -0.5px;
  }
  p {
    color: #a1a1aa;
    line-height: 1.8;
    font-size: 14px;
    max-width: 330px;
  }
  @media (max-width: 720px) {
    section {
      grid-template-columns: 1fr;
      padding: 40px 24px;
      gap: 32px;
    }
    p {
      max-width: none;
    }
  }
</style>

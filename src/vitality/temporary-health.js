function absorbTemporaryHealth(temporaryHealth, amount) {
  const available = temporaryHealth ?? 0;
  const absorbed = Math.min(available, amount);
  return { absorbed, remaining: available - absorbed };
}

module.exports = { absorbTemporaryHealth };

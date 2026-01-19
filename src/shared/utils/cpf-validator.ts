/**
 * Validates a CPF (Cadastro de Pessoas Físicas) number.
 * Implements the standard checksum algorithm.
 */
export function isValidCpf(cpf: string): boolean {
    // Remove non-numeric characters
    const cleanCpf = cpf.replace(/[^\d]/g, "");

    // Must have 11 digits
    if (cleanCpf.length !== 11) return false;

    // Reject known invalid patterns (all same digits)
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Validate first checksum digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCpf.charAt(9))) return false;

    // Validate second checksum digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
}

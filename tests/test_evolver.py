import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from evolver import evolve

class TestEvolver(unittest.TestCase):
    def test_application_process(self):
        initial_state = {
            "loan_id": "1234-ABCD",
            "status": "New"
        }
        events = [
            {"event type": "ApplicationReceived", "data": {"applicantName": "John Doe", "loanPurpose": "Home Renovation", "loanAmount": 25000}},
            {"event type": "CreditCheckInitiated", "data": {}},
            {"event type": "CreditCheckCompleted", "data": {"creditScore": 750, "creditStatus": "Good"}},
            {"event type": "ApplicationApproved", "data": {"reviewer": "Loan Officer", "decisionReason": "Excellent Credit Score"}},
            {"event type": "LoanDisbursed", "data": {"disbursementAmount": 25000, "disbursementDate": "2023-05-01"}}
        ]

        expected_state = {
            "loan_id": "1234-ABCD",
            "applicant_name": "John Doe",
            "loan_purpose": "Home Renovation",
            "loan_amount": 25000,
            "credit_score": 750,
            "credit_status": "Good",
            "loan_officer": "Loan Officer",
            "decision_reason": "Excellent Credit Score",
            "status": "LoanDisbursed",
            "disbursement_amount": 25000,
            "disbursement_date": "2023-05-01"
        }

        updated_state = evolve(initial_state, events)
        self.assertEqual(updated_state, expected_state)

if __name__ == '__main__':
    unittest.main()

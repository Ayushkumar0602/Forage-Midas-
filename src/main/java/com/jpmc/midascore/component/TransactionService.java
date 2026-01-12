package com.jpmc.midascore.component;

import com.jpmc.midascore.entity.TransactionRecord;
import com.jpmc.midascore.entity.UserRecord;
import com.jpmc.midascore.foundation.Transaction;
import com.jpmc.midascore.foundation.Incentive;
import com.jpmc.midascore.repository.TransactionRecordRepository;
import com.jpmc.midascore.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
public class TransactionService {

	private final UserRepository userRepository;
	private final TransactionRecordRepository transactionRecordRepository;
	private final RestTemplate restTemplate;

	public TransactionService(UserRepository userRepository, TransactionRecordRepository transactionRecordRepository, RestTemplate restTemplate) {
		this.userRepository = userRepository;
		this.transactionRecordRepository = transactionRecordRepository;
		this.restTemplate = restTemplate;
	}

	@Transactional
	public void processTransaction(Transaction transaction) {
		UserRecord sender = userRepository.findById(transaction.getSenderId());
		UserRecord recipient = userRepository.findById(transaction.getRecipientId());

		if (sender == null || recipient == null) {
			return;
		}

		float amount = transaction.getAmount();
		if (sender.getBalance() < amount) {
			return;
		}

		Incentive incentiveResponse = restTemplate.postForObject("http://localhost:8080/incentive", transaction, Incentive.class);
		float incentive = incentiveResponse != null ? incentiveResponse.getAmount() : 0f;

		sender.setBalance(sender.getBalance() - amount);
		recipient.setBalance(recipient.getBalance() + amount + incentive);
		userRepository.save(sender);
		userRepository.save(recipient);

		transactionRecordRepository.save(new TransactionRecord(sender, recipient, amount, incentive));
	}
}



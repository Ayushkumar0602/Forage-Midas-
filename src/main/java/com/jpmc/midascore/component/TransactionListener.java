package com.jpmc.midascore.component;

import com.jpmc.midascore.foundation.Transaction;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TransactionListener {

	private final TransactionService transactionService;

	public TransactionListener(TransactionService transactionService) {
		this.transactionService = transactionService;
	}

	@KafkaListener(topics = "${general.kafka-topic}")
	public void onTransaction(Transaction transaction) {
		transactionService.processTransaction(transaction);
	}
}



<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Http;
use RuntimeException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class ResendTransport extends AbstractTransport
{
    public function __construct(
        protected string $apiKey,
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('Resend API key is not configured. Set RESEND_API_KEY or MAIL_PASSWORD in .env.');
        }

        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $from = $email->getFrom()[0] ?? null;
        $fromFormatted = $from
            ? ($from->getName() ? "{$from->getName()} <{$from->getAddress()}>" : $from->getAddress())
            : (string) config('mail.from.address', 'onboarding@resend.dev');

        $to = array_map(
            fn (Address $address): string => $address->getAddress(),
            $email->getTo()
        );

        $payload = array_filter([
            'from' => $fromFormatted,
            'to' => array_values($to),
            'subject' => $email->getSubject(),
            'html' => $email->getHtmlBody(),
            'text' => $email->getTextBody(),
        ]);

        $client = Http::withToken($this->apiKey)
            ->acceptJson()
            ->timeout(15);

        if (! app()->environment('production') && empty(ini_get('curl.cainfo'))) {
            $client = $client->withoutVerifying();
        }

        $response = $client->post('https://api.resend.com/emails', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Resend API error: '.$response->status().' - '.$response->body());
        }
    }

    public function __toString(): string
    {
        return 'resend';
    }
}
